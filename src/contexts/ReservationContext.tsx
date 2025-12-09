import React, { createContext, useState, useEffect, ReactNode, useContext, useMemo, useCallback } from 'react';
import { ParkingSlot, Reservation, ParkingSlotStatus, PaymentMethod, ReservationStatus } from '../types';
import { AuthContext } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ReservationContextType {
  slots: ParkingSlot[];
  reservations: Reservation[];
  loading: boolean;
  addReservation: (slot: ParkingSlot, startTime: Date, endTime: Date, paymentMethod: PaymentMethod) => Promise<Reservation>;
  getReservationsForCurrentUser: () => Reservation[];
  getActiveReservationForCurrentUser: () => Reservation | undefined;
  extendReservation: (reservationId: string, hoursToAdd: number, paymentMethod: PaymentMethod) => Promise<void>;
  endReservation: (reservationId: string) => Promise<void>;
  addSlot: (slot: ParkingSlot) => void;
  updateSlot: (slot: ParkingSlot) => void;
  deleteSlot: (id: string) => void;
}

export const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Get auth context but don't require it to prevent loading deadlock
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;

  useEffect(() => {
    const fetchWithTimeout = async (promise: Promise<any>, timeoutMs = 12000) => { // Increased from 8s to 12s
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
      );
      return Promise.race([promise, timeoutPromise]);
    };

    const fetchData = async () => {
      const MAX_RETRIES = 2;
      setLoading(true);

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Calculate timeout with exponential backoff
          const timeout = 12000 * Math.pow(1.5, attempt);

          // Fetch parking lots from Supabase with timeout
          const lotsPromise = supabase.from('parking_lots').select('*');
          const { data: lotsData, error: lotsError } = await fetchWithTimeout(lotsPromise, timeout) as any;

          if (lotsError) {
            throw lotsError;
          }

          if (lotsData) {
            // Map Supabase data to ParkingSlot format
            const mapped: ParkingSlot[] = lotsData.map(lot => ({
              id: lot.id,
              name: lot.name,
              location: [lot.latitude, lot.longitude] as [number, number],
              address: lot.address || lot.name,
              status: (Object.values(ParkingSlotStatus).includes(lot.status as ParkingSlotStatus) ? lot.status : ParkingSlotStatus.AVAILABLE) as ParkingSlotStatus,
              type: (lot.vehicle_type || 'Car') as any,
              pricePerHour: lot.price_per_hour || 0,
              features: lot.features || [],
              operatingHours: lot.operating_hours || '24/7',
            }));

            setSlots(mapped);
          }

          // Fetch reservations from Supabase with timeout
          const resPromise = supabase.from('reservations').select('*');
          const { data: resData, error: resError } = await fetchWithTimeout(resPromise, timeout) as any;

          if (resError) {
            throw resError;
          }

          if (resData) {
            // Map Supabase data to Reservation format
            const mappedRes: Reservation[] = resData.map(res => ({
              id: res.id,
              userId: res.user_id,
              slotId: res.parking_lot_id,
              startTime: new Date(res.start_time),
              endTime: new Date(res.end_time),
              totalCost: parseFloat(res.total_cost),
              status: res.status as ReservationStatus,
              paymentMethod: res.payment_method as PaymentMethod,
            }));
            setReservations(mappedRes);
          }

          // Success - exit retry loop
          break;
        } catch (error: any) {
          console.error(`[DB] Fetch data failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);

          if (attempt === MAX_RETRIES) {
            // Final attempt failed - set empty state but don't crash
            console.error('[DB] All retry attempts failed, using empty state');
            setSlots([]);
            setReservations([]);
          } else {
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      // ALWAYS stop loading, even on timeout/error
      setLoading(false);
    };

    fetchData();
  }, []);

  const getReservationsForCurrentUser = useCallback((): Reservation[] => {
    if (!user) return [];
    return reservations.filter(r => r.userId === user.id).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [user, reservations]);

  const getActiveReservationForCurrentUser = useCallback((): Reservation | undefined => {
    if (!user) return undefined;
    const now = new Date();
    return reservations.find(r => r.userId === user.id && r.status === ReservationStatus.ACTIVE && r.endTime > now);
  }, [user, reservations]);

  const addReservation = useCallback(async (slot: ParkingSlot, startTime: Date, endTime: Date, paymentMethod: PaymentMethod): Promise<Reservation> => {
    if (!user) throw new Error("User not logged in");

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      throw new Error("Invalid reservation duration.");
    }

    const totalCost = slot.pricePerHour * durationHours;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          parking_lot_id: slot.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          total_cost: totalCost,
          status: ReservationStatus.ACTIVE,
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (error) throw error;

      const newReservation: Reservation = {
        id: data.id,
        userId: data.user_id,
        slotId: data.parking_lot_id,
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
        totalCost: parseFloat(data.total_cost),
        status: data.status as ReservationStatus,
        paymentMethod: data.payment_method as PaymentMethod,
      };

      setReservations(prev => [...prev, newReservation]);
      setSlots(prevSlots => prevSlots.map(s =>
        s.id === slot.id ? { ...s, status: ParkingSlotStatus.RESERVED } : s
      ));

      // Also update the slot status in DB
      await supabase
        .from('parking_lots')
        .update({ status: ParkingSlotStatus.RESERVED })
        .eq('id', slot.id);

      return newReservation;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }, [user]);

  const extendReservation = useCallback(async (reservationId: string, hoursToAdd: number, paymentMethod: PaymentMethod): Promise<void> => {
    if (hoursToAdd <= 0) {
      throw new Error("Extension duration must be positive.");
    }

    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    const slot = slots.find(s => s.id === reservation.slotId);
    if (!slot) {
      throw new Error("Associated slot not found");
    }

    try {
      const additionalCost = slot.pricePerHour * hoursToAdd;
      const newEndTime = new Date(reservation.endTime.getTime() + hoursToAdd * 60 * 60 * 1000);
      const newTotalCost = reservation.totalCost + additionalCost;

      const { error } = await supabase
        .from('reservations')
        .update({
          end_time: newEndTime.toISOString(),
          total_cost: newTotalCost
        })
        .eq('id', reservationId);

      if (error) throw error;

      setReservations(prevReservations => {
        return prevReservations.map(r => {
          if (r.id === reservationId) {
            return {
              ...r,
              endTime: newEndTime,
              totalCost: newTotalCost,
            };
          }
          return r;
        });
      });
    } catch (error) {
      console.error('Error extending reservation:', error);
      throw error;
    }
  }, [reservations, slots]);

  const endReservation = useCallback(async (reservationId: string): Promise<void> => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    try {
      // Update reservation status
      const { error: resError } = await supabase
        .from('reservations')
        .update({
          status: ReservationStatus.COMPLETED,
          end_time: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (resError) throw resError;

      // Update slot status to AVAILABLE
      const { error: slotError } = await supabase
        .from('parking_lots')
        .update({ status: ParkingSlotStatus.AVAILABLE })
        .eq('id', reservation.slotId);

      if (slotError) throw slotError;

      setReservations(prev =>
        prev.map(r =>
          r.id === reservationId ? { ...r, status: ReservationStatus.COMPLETED, endTime: new Date() } : r
        )
      );

      setSlots(prev =>
        prev.map(s =>
          s.id === reservation.slotId ? { ...s, status: ParkingSlotStatus.AVAILABLE } : s
        )
      );
    } catch (error) {
      console.error('Error ending reservation:', error);
      throw error;
    }
  }, [reservations]);

  // CRUD for Slots
  const addSlot = useCallback(async (slot: ParkingSlot) => {
    try {
      // Insert into database
      const { error } = await supabase.from('parking_lots').insert({
        id: slot.id,
        name: slot.name,
        latitude: slot.location[0],
        longitude: slot.location[1],
        address: slot.address,
        status: slot.status,
        vehicle_type: slot.type,
        price_per_hour: slot.pricePerHour,
        features: slot.features || [],
        operating_hours: slot.operatingHours || '24/7',
      });

      if (error) {
        console.error('Error adding parking slot:', error);
        throw error;
      }

      // Update local state
      setSlots(prev => [...prev, slot]);
    } catch (error) {
      console.error('Failed to add parking slot:', error);
      throw error;
    }
  }, []);

  const updateSlot = useCallback(async (slot: ParkingSlot) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parking_lots')
        .update({
          name: slot.name,
          latitude: slot.location[0],
          longitude: slot.location[1],
          address: slot.address,
          status: slot.status,
          vehicle_type: slot.type,
          price_per_hour: slot.pricePerHour,
          features: slot.features || [],
          operating_hours: slot.operatingHours || '24/7',
        })
        .eq('id', slot.id);

      if (error) {
        console.error('Error updating parking slot:', error);
        throw error;
      }

      // Update local state
      setSlots(prev => prev.map(s => s.id === slot.id ? slot : s));
    } catch (error) {
      console.error('Failed to update parking slot:', error);
      throw error;
    }
  }, []);

  const deleteSlot = useCallback(async (id: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('parking_lots')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting parking slot:', error);
        throw error;
      }

      // Update local state
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete parking slot:', error);
      throw error;
    }
  }, []);


  const value = useMemo(() => ({
    slots,
    reservations,
    loading,
    addReservation,
    getReservationsForCurrentUser,
    getActiveReservationForCurrentUser,
    extendReservation,
    endReservation,
    addSlot,
    updateSlot,
    deleteSlot
  }), [
    slots,
    reservations,
    loading,
    addReservation,
    getReservationsForCurrentUser,
    getActiveReservationForCurrentUser,
    extendReservation,
    endReservation,
    addSlot,
    updateSlot,
    deleteSlot
  ]);


  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
};
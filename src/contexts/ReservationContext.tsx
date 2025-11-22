import React, { createContext, useState, useEffect, ReactNode, useContext, useMemo, useCallback } from 'react';
import { ParkingSlot, Reservation, ParkingSlotStatus, PaymentMethod, ReservationStatus } from '../types';
import { mockParkingSlots, mockReservations } from '../data/mockData';
import { AuthContext } from './AuthContext';

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
  
  const authContext = useContext(AuthContext);
  if (!authContext) {
      throw new Error("ReservationContext must be used within an AuthProvider");
  }
  const { user } = authContext;

  useEffect(() => {
    // Simulate fetching initial data
    setLoading(true);
    setTimeout(() => {
      setSlots(mockParkingSlots);
      setReservations(mockReservations);
      setLoading(false);
    }, 500);
  }, []);
  
  const getReservationsForCurrentUser = useCallback((): Reservation[] => {
    if(!user) return [];
    return reservations.filter(r => r.userId === user.id).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
  }, [user, reservations]);

  const getActiveReservationForCurrentUser = useCallback((): Reservation | undefined => {
    if(!user) return undefined;
    const now = new Date();
    return reservations.find(r => r.userId === user.id && r.status === ReservationStatus.ACTIVE && r.endTime > now);
  }, [user, reservations]);
  
  const addReservation = useCallback(async (slot: ParkingSlot, startTime: Date, endTime: Date, paymentMethod: PaymentMethod): Promise<Reservation> => {
     if(!user) throw new Error("User not logged in");

    // Simulate API call
    await new Promise(res => setTimeout(res, 500));

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      throw new Error("Invalid reservation duration.");
    }
    
    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      userId: user.id,
      slotId: slot.id,
      startTime,
      endTime,
      totalCost: slot.pricePerHour * durationHours,
      status: ReservationStatus.ACTIVE,
      paymentMethod,
    };

    setReservations(prev => [...prev, newReservation]);
    setSlots(prevSlots => prevSlots.map(s => 
      s.id === slot.id ? { ...s, status: ParkingSlotStatus.RESERVED } : s
    ));
    
    return newReservation;
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

    // Simulate API call
    await new Promise(res => setTimeout(res, 300));

    setReservations(prevReservations => {
      return prevReservations.map(r => {
        if (r.id === reservationId) {
          const additionalCost = slot.pricePerHour * hoursToAdd;
          const newEndTime = new Date(r.endTime.getTime() + hoursToAdd * 60 * 60 * 1000);
          return {
            ...r,
            endTime: newEndTime,
            totalCost: r.totalCost + additionalCost,
          };
        }
        return r;
      });
    });
  }, [reservations, slots]);

  const endReservation = useCallback(async (reservationId: string): Promise<void> => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      throw new Error("Reservation not found");
    }

    // Simulate API call to the backend
    await new Promise(res => setTimeout(res, 300));

    // Update reservations: set status to Completed and endTime to now
    setReservations(prev =>
      prev.map(r =>
        r.id === reservationId ? { ...r, status: ReservationStatus.COMPLETED, endTime: new Date() } : r
      )
    );

    // Update slot: set status to Available
    setSlots(prev =>
      prev.map(s =>
        s.id === reservation.slotId ? { ...s, status: ParkingSlotStatus.AVAILABLE } : s
      )
    );
  }, [reservations]);

  // CRUD for Slots
  const addSlot = useCallback((slot: ParkingSlot) => {
      setSlots(prev => [...prev, slot]);
  }, []);

  const updateSlot = useCallback((slot: ParkingSlot) => {
      setSlots(prev => prev.map(s => s.id === slot.id ? slot : s));
  }, []);

  const deleteSlot = useCallback((id: string) => {
      setSlots(prev => prev.filter(s => s.id !== id));
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
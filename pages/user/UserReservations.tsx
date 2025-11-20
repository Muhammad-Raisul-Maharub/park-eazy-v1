import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../../contexts/ReservationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ParkingSlot, ParkingSlotType, Reservation, ReservationStatus } from '../../types';
import { Car, Bike, Truck, Calendar, Clock, CircleDollarSign, MapPin } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const ReservationCard: React.FC<{ reservation: Reservation, slot: ParkingSlot | undefined, onNavigate: (slot: ParkingSlot) => void, delay: number }> = ({ reservation, slot, onNavigate, delay }) => {
    if (!slot) return null;

    const vehicleIcons: { [key in ParkingSlotType]: React.ReactElement } = {
        [ParkingSlotType.CAR]: <Car className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
        [ParkingSlotType.BIKE]: <Bike className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
        [ParkingSlotType.SUV]: <Car className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
        [ParkingSlotType.MINIVAN]: <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
        [ParkingSlotType.TRUCK]: <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
    };

    const statusBadge = reservation.status === ReservationStatus.ACTIVE
        ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
        : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    
    return (
        <Card className="bg-white dark:bg-slate-800 p-0 overflow-hidden animate-fadeIn" style={{ animationDelay: `${delay}ms`}}>
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{slot.name}</h3>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadge}`}>{reservation.status}</span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            {vehicleIcons[slot.type]}
                            <span>{slot.type} Slot</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{reservation.startTime.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>
                                {reservation.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {reservation.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end justify-between h-full w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="flex items-center gap-1.5 self-end">
                        <CircleDollarSign className="w-5 h-5 text-primary" />
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(reservation.totalCost)}</span>
                    </div>
                     {reservation.status === ReservationStatus.ACTIVE && (
                        <Button variant="secondary" size="sm" className="mt-4 !py-1.5 !px-3 w-full sm:w-auto" onClick={() => onNavigate(slot)}>
                            <MapPin size={14} className="mr-1.5" />
                            View on Map
                        </Button>
                     )}
                </div>
            </div>
        </Card>
    );
};


const UserReservations: React.FC = () => {
    const reservationContext = useContext(ReservationContext);
    const navigate = useNavigate();

    if (!reservationContext) {
        return <div>Loading...</div>;
    }
    const { getReservationsForCurrentUser, slots } = reservationContext;
    const userReservations = getReservationsForCurrentUser();

    const getSlotById = (slotId: string): ParkingSlot | undefined => {
        return slots.find(slot => slot.id === slotId);
    }

    const handleNavigate = (slot: ParkingSlot) => {
        navigate('/map', { state: { slotId: slot.id } });
    }
    
    const activeReservations = userReservations.filter(r => r.status === ReservationStatus.ACTIVE);
    const completedReservations = userReservations.filter(r => r.status !== ReservationStatus.ACTIVE);
    
    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Reservations</h1>
            </div>
            
            <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Active</h2>
                {activeReservations.length > 0 ? (
                    <div className="space-y-4">
                        {activeReservations.map((res, index) => (
                            <ReservationCard key={res.id} reservation={res} slot={getSlotById(res.slotId)} onNavigate={handleNavigate} delay={index * 100} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-8 bg-slate-50 dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-600">
                        <p className="text-slate-500 dark:text-slate-400">You have no active reservations.</p>
                    </Card>
                )}
            </section>

             <section>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Completed</h2>
                {completedReservations.length > 0 ? (
                    <div className="space-y-4">
                        {completedReservations.map((res, index) => (
                             <ReservationCard key={res.id} reservation={res} slot={getSlotById(res.slotId)} onNavigate={handleNavigate} delay={index * 100} />
                        ))}
                    </div>
                ) : (
                     <Card className="text-center py-8 bg-slate-50 dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-600">
                        <p className="text-slate-500 dark:text-slate-400">Your past reservations will appear here.</p>
                    </Card>
                )}
            </section>
        </div>
    );
};

export default UserReservations;
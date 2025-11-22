
import React, { useContext, useState, useEffect, useRef } from 'react';
import { ReservationContext } from '../../contexts/ReservationContext';
import Button from '../../components/common/Button';
import { Timer, ParkingSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ParkingSlotType } from '../../types';
import { Car, Bike, Truck } from 'lucide-react';
import ExtendTimeModal from '../../components/modals/ExtendTimeModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { getGenericMarkerIcon } from '../../utils/mapHelpers';
import { formatCurrency } from '../../utils/formatters';

const activeMarker = getGenericMarkerIcon('amber');

const ActiveReservationPage: React.FC = () => {
  const reservationContext = useContext(ReservationContext);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const mapRef = useRef<L.Map>(null);

  if (!reservationContext) return <div className="p-8">Loading context...</div>;

  const { getActiveReservationForCurrentUser, slots, endReservation } = reservationContext;
  const activeReservation = getActiveReservationForCurrentUser();
  const slot = activeReservation ? slots.find(s => s.id === activeReservation.slotId) : null;


  useEffect(() => {
    if (!activeReservation) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const endTime = activeReservation.endTime.getTime();
      const distance = endTime - now;

      if (distance < 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        clearInterval(interval);
        return;
      }

      setIsExpired(false);
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReservation]);
  
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
        // When the component mounts and map is available, invalidate its size
        // to ensure it renders correctly within its container.
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }
  }, [slot]); // Re-run if the slot changes


  const handleConfirmExtension = (hoursToAdd: number) => {
    if (!activeReservation || !slot) return;

    const additionalCost = hoursToAdd * slot.pricePerHour;
    const newEndTime = new Date(activeReservation.endTime.getTime() + hoursToAdd * 60 * 60 * 1000);

    setIsExtendModalOpen(false);
    navigate('/payment', {
        state: {
            isExtension: true,
            reservation: activeReservation,
            slot: slot,
            hoursToAdd: hoursToAdd,
            totalCost: additionalCost,
            newEndTime: newEndTime.toISOString()
        }
    });
  };
  
  const handleEndReservation = async () => {
    if (!activeReservation) return;
    try {
        await endReservation(activeReservation.id);
        setIsEndConfirmOpen(false);
    } catch (error) {
        console.error("Failed to end reservation:", error);
        alert('Failed to end reservation. Please try again.');
    }
  };

  if (!activeReservation) {
    return (
      <div className="p-8 text-center animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">No Active Reservation</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Find a spot and book your parking now!</p>
        <Link to="/map">
          <Button className="mt-4">
            Find Parking
          </Button>
        </Link>
      </div>
    );
  }

  const formattedTime = `${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m ${String(timeLeft.seconds).padStart(2, '0')}s`;

  const typeIcon = {
    [ParkingSlotType.CAR]: <Car className="w-5 h-5 text-slate-400" />,
    [ParkingSlotType.BIKE]: <Bike className="w-5 h-5 text-slate-400" />,
    [ParkingSlotType.SUV]: <Car className="w-5 h-5 text-slate-400" />,
    [ParkingSlotType.MINIVAN]: <Truck className="w-5 h-5 text-slate-400" />,
    [ParkingSlotType.TRUCK]: <Truck className="w-5 h-5 text-slate-400" />,
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fadeIn">
        <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-lg text-center">
                <h2 className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-widest">TIME REMAINING</h2>
                <p className={`text-4xl sm:text-5xl font-bold mt-2 tabular-nums ${isExpired ? 'text-red-500' : 'text-primary'}`}>
                    {isExpired ? 'EXPIRED' : formattedTime}
                </p>
            </div>

            {slot && (
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 px-2">Location</h3>
                    <div className="h-48 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                        <MapContainer
                            ref={mapRef}
                            center={slot.location}
                            zoom={17}
                            scrollWheelZoom={false}
                            zoomControl={false}
                            dragging={false}
                            doubleClickZoom={false}
                            touchZoom={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                className="dark:brightness-75 dark:contrast-150 dark:grayscale"
                            />
                            <Marker position={slot.location} icon={activeMarker} />
                        </MapContainer>
                    </div>
                </div>
            )}

            <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Booking Details</h3>
                <div className="space-y-4 text-slate-600 dark:text-slate-200">
                    <div className="flex items-center gap-4">
                        <ParkingSquare className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <span>{slot?.name}</span>
                    </div>
                     <div className="flex items-center gap-4">
                        {slot ? typeIcon[slot.type] : <Car className="w-5 h-5 text-slate-500 dark:text-slate-400"/>}
                        <span>{slot?.type} Slot</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-lg text-primary">{formatCurrency(activeReservation.totalCost)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Timer className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <span>Ends at: {activeReservation.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <Button variant="primary" size="lg" onClick={() => setIsExtendModalOpen(true)}>Extend Time</Button>
                <Button variant="danger" size="lg" onClick={() => setIsEndConfirmOpen(true)}>End Reservation</Button>
            </div>
        </div>
        {slot && activeReservation && (
            <ExtendTimeModal
                isOpen={isExtendModalOpen}
                onClose={() => setIsExtendModalOpen(false)}
                onConfirm={handleConfirmExtension}
                reservation={activeReservation}
                slot={slot}
            />
        )}
        {activeReservation && (
            <ConfirmationModal
                isOpen={isEndConfirmOpen}
                onClose={() => setIsEndConfirmOpen(false)}
                onConfirm={handleEndReservation}
                title="End Reservation"
                message="Are you sure you want to end your parking reservation now? This action cannot be undone."
                confirmButtonText="Yes, End Now"
                confirmButtonVariant="danger"
            />
        )}
    </div>
  );
};

export default ActiveReservationPage;

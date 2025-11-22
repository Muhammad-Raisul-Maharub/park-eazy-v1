import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { ReservationContext } from '../../contexts/ReservationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { Map, Clock, Car, BookMarked, CircleDollarSign, Star, MapPin } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { formatCurrency } from '../../utils/formatters';
import { analyzeUserPattern, UserParkingPattern } from '../../utils/smartDefaults';
import { ParkingSlot } from '../../types';
import FullPageLoader from '../../components/common/FullPageLoader';

const UserDashboard: React.FC = () => {
  const authContext = useContext(AuthContext);
  const reservationContext = useContext(ReservationContext);
  const [timeLeft, setTimeLeft] = useState('');
  const [userPattern, setUserPattern] = useState<UserParkingPattern | null>(null);
  const navigate = useNavigate();

  if (!authContext || !authContext.user || !reservationContext) {
    return <FullPageLoader />;
  }
  const { user } = authContext;
  const { getActiveReservationForCurrentUser, getReservationsForCurrentUser, slots } = reservationContext;
  
  const activeReservation = getActiveReservationForCurrentUser();
  const allReservations = getReservationsForCurrentUser();

  const totalBookings = allReservations.length;
  const totalSpent = allReservations.reduce((sum, res) => sum + res.totalCost, 0);

  useEffect(() => {
    const pattern = analyzeUserPattern(allReservations);
    setUserPattern(pattern);
  }, [allReservations]);

  useEffect(() => {
    if (!activeReservation) return;

    const intervalId = setInterval(() => {
      const remaining = activeReservation.endTime.getTime() - new Date().getTime();
      if (remaining <= 0) {
        setTimeLeft('Expired');
        clearInterval(intervalId);
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [activeReservation]);

  const activeSlot = activeReservation ? slots.find(s => s.id === activeReservation.slotId) : null;
  
  const handleCardNavigation = (path: string, state?: object) => {
    navigate(path, { state });
  };
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name}!</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Ready to park? Let's get started.</p>
      </div>

      {activeReservation && activeSlot ? (
        <Card className="bg-white dark:bg-slate-800 border-2 border-primary/50 dark:border-primary/70 shadow-sm animate-fadeIn [animation-delay:100ms]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-primary">Active Reservation</div>
                <div className="flex items-center gap-2 mt-2 text-slate-800 dark:text-slate-200">
                  <Car className="w-5 h-5"/>
                  <span className="font-semibold text-lg">{activeSlot.name}</span>
                  <span>({activeSlot.type})</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-slate-800 dark:text-slate-200">
                  <Clock className="w-5 h-5"/>
                  <span className="font-mono">{timeLeft}</span>
                </div>
              </div>
              <Button onClick={() => navigate('/active-reservation')}>
                View Details
              </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-slate-50 dark:bg-slate-800/50 animate-fadeIn [animation-delay:100ms]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Active Reservation</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Find and book a parking spot near you.</p>
            </div>
            <Button onClick={() => navigate('/map')}>
                <Map className="w-5 h-5 mr-2" /> Find Parking
            </Button>
          </div>
        </Card>
      )}

      {userPattern && userPattern.favoriteSlots.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Your Favorite Spots
          </h2>
          <div className="space-y-2">
            {userPattern.favoriteSlots.map(slotId => {
              const slot = slots.find(s => s.id === slotId);
              if (!slot) return null;
              
              const navState = { slotId: slot.id };

              return (
                <div
                  key={slot.id}
                  onClick={() => handleCardNavigation('/map', navState)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardNavigation('/map', navState)}
                  role="link"
                  tabIndex={0}
                  className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{slot.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        You park here often • ৳{slot.pricePerHour}/hr
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCardNavigation('/map', navState);
                    }}
                  >
                    Book Again
                  </Button>
                </div>
              );
            })}
          </div>
          
          {userPattern.averageDuration && (
            <div className="mt-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                💡 <strong>Smart Tip:</strong> You typically park for{' '}
                <span className="font-semibold text-primary">
                  {userPattern.averageDuration} hours
                </span>
                . We'll suggest this next time!
              </p>
            </div>
          )}
        </Card>
      )}

      <div className="animate-fadeIn [animation-delay:200ms]">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="animate-fadeIn [animation-delay:300ms]"><StatCard icon={BookMarked} title="Total Bookings" value={totalBookings.toString()} /></div>
            <div className="animate-fadeIn [animation-delay:400ms]"><StatCard icon={CircleDollarSign} title="Total Spent" value={formatCurrency(totalSpent)} /></div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
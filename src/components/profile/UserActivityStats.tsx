import React, { useContext, useMemo } from 'react';
import { ReservationContext } from '../../contexts/ReservationContext';
import StatCard from '../common/StatCard';
import { BookCheck, CircleDollarSign, Star } from 'lucide-react';
import { PaymentMethod } from '../../types';

const UserActivityStats: React.FC = () => {
  const reservationContext = useContext(ReservationContext);

  const stats = useMemo(() => {
    if (!reservationContext) {
      return { totalBookings: 0, totalSpent: 0, favoritePayment: 'N/A' };
    }

    const userReservations = reservationContext.getReservationsForCurrentUser();
    const totalBookings = userReservations.length;
    const totalSpent = userReservations.reduce((sum, res) => sum + res.totalCost, 0);

    const paymentCounts: { [key in PaymentMethod]?: number } = {};
    let favoritePayment: string = 'N/A';

    if (totalBookings > 0) {
        userReservations.forEach(res => {
            if (res.paymentMethod) {
                paymentCounts[res.paymentMethod] = (paymentCounts[res.paymentMethod] || 0) + 1;
            }
        });

        const paymentEntries = Object.entries(paymentCounts);
        if (paymentEntries.length > 0) {
            const [favMethod] = paymentEntries.reduce((a, b) => (b[1] > a[1] ? b : a));
            favoritePayment = favMethod;
        }
    }

    return { totalBookings, totalSpent, favoritePayment };
  }, [reservationContext]);

  return (
    <div>
        <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Your Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={BookCheck} title="Total Bookings" value={stats.totalBookings.toString()} />
            <StatCard icon={CircleDollarSign} title="Total Spent" value={`৳${stats.totalSpent.toLocaleString()}`} />
            <StatCard icon={Star} title="Favorite Payment" value={stats.favoritePayment} />
        </div>
    </div>
  );
};

export default UserActivityStats;

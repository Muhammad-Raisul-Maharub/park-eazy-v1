
import { Reservation, ParkingSlot } from '../types';

export const getSmartDuration = (): number => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Weekend logic
  if (day === 0 || day === 6) { // Sunday or Saturday
    if (hour >= 10 && hour < 22) return 4; // Weekend outing
    return 10; // Overnight
  }
  
  // Weekday logic
  if (hour >= 6 && hour < 9) return 9; // Work day (8hrs + 1hr buffer)
  if (hour >= 9 && hour < 12) return 3; // Late start/half day
  if (hour >= 12 && hour < 15) return 2; // Lunch meeting
  if (hour >= 15 && hour < 18) return 2; // Afternoon appointment
  if (hour >= 18 && hour < 22) return 2; // Evening plans
  return 10; // Overnight parking
};

export const getParkingTips = (slot: ParkingSlot, hour: number): string => {
  const tips: { [key: string]: string } = {
    morning: `💡 Parking fills up fast during morning hours`,
    lunch: `🍽️ Perfect timing for lunch parking`,
    evening: `🌆 Evening rates apply after 6 PM`,
    night: `🌙 Safe overnight parking with CCTV`,
  };

  if (hour >= 6 && hour < 10) return tips.morning;
  if (hour >= 12 && hour < 15) return tips.lunch;
  if (hour >= 18 && hour < 22) return tips.evening;
  if (hour >= 22 || hour < 6) return tips.night;
  return '';
};

// Fallback suggestions for users with no history
export const getGeneralSuggestion = (): { title: string, message: string, action?: string } => {
    const hour = new Date().getHours();
    
    if (hour >= 7 && hour < 10) {
        return {
            title: "Morning Rush?",
            message: "Finding a spot can be tricky now. Look for 'Multi-storey' spots for better availability.",
        };
    }
    if (hour >= 11 && hour < 14) {
        return {
            title: "Lunch Break",
            message: "Short term parking is in high demand. Try booking for at least 2 hours to secure a spot.",
        };
    }
    if (hour >= 17 && hour < 21) {
        return {
            title: "Evening Out",
            message: "Safe, well-lit spots near shopping centers are popular right now.",
        };
    }
    if (hour >= 21 || hour < 6) {
        return {
            title: "Overnight Parking",
            message: "We recommend spots with 'Guarded' or 'CCTV' features for overnight safety.",
        };
    }
    return {
        title: "Find Your Spot",
        message: "Use the search bar or filters to find the perfect parking slot for your vehicle.",
    };
};

export interface UserParkingPattern {
  favoriteSlots: string[]; // slot IDs
  averageDuration: number;
  commonDays: number[]; // 0-6 (Sunday-Saturday)
  commonHours: number[]; // 0-23
}

export const analyzeUserPattern = (
  reservations: Reservation[]
): UserParkingPattern => {
  if (reservations.length === 0) {
    return {
      favoriteSlots: [],
      averageDuration: getSmartDuration(),
      commonDays: [],
      commonHours: [],
    };
  }

  // Calculate average duration
  const durations = reservations.map(r => 
    (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60)
  );
  const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  // Find most used slots
  const slotCounts = reservations.reduce((acc, r) => {
    acc[r.slotId] = (acc[r.slotId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const favoriteSlots = Object.entries(slotCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  // Find common days
  const dayCounts = reservations.reduce((acc, r) => {
    const day = r.startTime.getDay();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const commonDays = Object.entries(dayCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([day]) => parseInt(day));

  // Find common hours
  const hourCounts = reservations.reduce((acc, r) => {
    const hour = r.startTime.getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const commonHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  return {
    favoriteSlots,
    averageDuration: Math.round(averageDuration * 2) / 2, // Round to nearest 0.5
    commonDays,
    commonHours,
  };
};

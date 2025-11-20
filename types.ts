export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum ParkingSlotStatus {
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  OCCUPIED = 'Occupied',
}

export enum ParkingSlotType {
  CAR = 'Car',
  BIKE = 'Bike',
  SUV = 'SUV',
  MINIVAN = 'Minivan',
  TRUCK = 'Truck',
}

export interface ParkingSlot {
  id: string;
  name: string;
  location: [number, number];
  address?: string;
  status: ParkingSlotStatus;
  type: ParkingSlotType;
  pricePerHour: number;
  features?: string[];
  operatingHours?: string;
  rating?: number;
  reviews?: number;
}

export enum ReservationStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface Reservation {
  id: string;
  userId: string;
  slotId: string;
  startTime: Date;
  endTime: Date;
  totalCost: number;
  status: ReservationStatus;
  paymentMethod?: PaymentMethod;
}

export enum PaymentMethod {
  BKASH = 'bKash',
  NAGAD = 'Nagad',
  CARD = 'Card',
  ROCKET = 'Rocket',
}

export interface BaseSavedPaymentMethod {
  id: string;
  type: PaymentMethod;
}

export interface SavedCard extends BaseSavedPaymentMethod {
  type: PaymentMethod.CARD;
  cardholderName: string;
  last4: string;
  expiryDate: string; // MM/YY
}

export interface SavedMobileWallet extends BaseSavedPaymentMethod {
  type: PaymentMethod.BKASH | PaymentMethod.NAGAD | PaymentMethod.ROCKET;
  accountNumber: string; // Store the full number
}

export type SavedPaymentMethod = SavedCard | SavedMobileWallet;


export interface SystemLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  details: string;
}
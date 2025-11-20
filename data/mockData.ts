import { User, UserRole, ParkingSlot, ParkingSlotStatus, ParkingSlotType, Reservation, SystemLog, PaymentMethod, ReservationStatus } from '../types';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Test User',
    email: 'user@test.com',
    role: UserRole.USER,
  },
  {
    id: 'user-2',
    name: 'Jane Doe',
    email: 'jane.doe@test.com',
    role: UserRole.USER,
  },
   {
    id: 'user-3',
    name: 'Karim Rahman',
    email: 'karim.rahman@test.com',
    role: UserRole.USER,
  },
  {
    id: 'admin-1',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  },
  {
    id: 'admin-2',
    name: 'Mike Ross',
    email: 'mike.ross@test.com',
    role: UserRole.ADMIN,
  },
  {
    id: 'superadmin-1',
    name: 'Super Admin',
    email: 'superadmin@parkeazy.com',
    role: UserRole.SUPER_ADMIN,
  },
  {
    id: 'admin-3',
    name: 'Raisul Maharub',
    email: 'raisulmaharub5@gmail.com',
    role: UserRole.ADMIN,
  },
];

export const mockParkingSlots: ParkingSlot[] = [
  // Chittagong
  { id: 'ctg-1', name: 'GEC-01', location: [22.359, 91.821], address: 'Near GEC Convention Hall, Chittagong', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.CAR, pricePerHour: 50, features: ['CCTV', 'Guarded'], operatingHours: '24/7', rating: 4.8, reviews: 35 },
  { id: 'ctg-2', name: 'GEC-02', location: [22.357, 91.822], address: 'Central Plaza, GEC Circle, Chittagong', status: ParkingSlotStatus.OCCUPIED, type: ParkingSlotType.SUV, pricePerHour: 70, features: ['Multi-storey parking', 'Valet parking'], operatingHours: '9 AM - 11 PM', rating: 4.5, reviews: 20 },
  { id: 'ctg-3', name: 'AGB-01', location: [22.333, 91.815], address: 'Agrabad Access Road, Chittagong', status: ParkingSlotStatus.RESERVED, type: ParkingSlotType.BIKE, pricePerHour: 20, features: ['Guarded'], operatingHours: '24/7', rating: 4.2, reviews: 15 },
  { id: 'ctg-4', name: 'AGB-02', location: [22.335, 91.817], address: 'Badamtali, Agrabad, Chittagong', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.TRUCK, pricePerHour: 100, features: ['Guarded', 'CCTV'], operatingHours: '24/7', rating: 4.0, reviews: 10 },
  { id: 'ctg-5', name: 'NAS-01', location: [22.366, 91.832], address: 'CDA Avenue, Nasirabad, Chittagong', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.MINIVAN, pricePerHour: 80, features: ['CCTV', 'Multi-storey parking'], operatingHours: '8 AM - 12 AM', rating: 4.6, reviews: 28 },
  { id: 'ctg-6', name: 'JAM-01', location: [22.370, 91.835], address: 'Jamalkhan, Chittagong', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.CAR, pricePerHour: 60, features: ['Valet parking', 'Guarded'], operatingHours: '24/7', rating: 4.9, reviews: 45 },
  { id: 'ctg-7', name: 'CBZ-01', location: [22.345, 91.838], address: 'Chawkbazar, Chittagong', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.BIKE, pricePerHour: 25, features: ['CCTV'], operatingHours: '7 AM - 11 PM' },
  { id: 'ctg-8', name: 'KHL-01', location: [22.375, 91.840], address: 'Khulshi, Chittagong', status: ParkingSlotStatus.OCCUPIED, type: ParkingSlotType.SUV, pricePerHour: 75, features: ['Multi-storey parking', 'Guarded'], operatingHours: '24/7', rating: 4.7, reviews: 33 },
  { id: 'ctg-9', name: 'KHL-02', location: [22.376, 91.842], address: 'Near Khulshi Mart, Chittagong', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.CAR, pricePerHour: 65, features: ['CCTV', 'Guarded'], operatingHours: '9 AM - 10 PM' },
  { id: 'ctg-10', name: 'ZKB-01', location: [22.361, 91.825], address: 'Sanmar Ocean City, Chittagong', status: ParkingSlotStatus.RESERVED, type: ParkingSlotType.CAR, pricePerHour: 80, features: ['CCTV', 'Guarded', 'Multi-storey parking'], operatingHours: '10 AM - 10 PM', rating: 4.8, reviews: 180 },

  // Dhaka
  { id: 'dhk-1', name: 'Gulshan DCC-01', location: [23.7925, 90.4078], address: 'Gulshan 1 DCC Market, Dhaka', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.SUV, pricePerHour: 120, features: ['CCTV', 'Guarded', 'Multi-storey parking'], operatingHours: '24/7', rating: 4.9, reviews: 150 },
  { id: 'dhk-2', name: 'Bashundhara-01', location: [23.7522, 90.3905], address: 'Bashundhara City, Panthapath, Dhaka', status: ParkingSlotStatus.OCCUPIED, type: ParkingSlotType.CAR, pricePerHour: 100, features: ['Multi-storey parking', 'Valet parking'], operatingHours: '10 AM - 10 PM', rating: 4.7, reviews: 250 },
  { id: 'dhk-3', name: 'Dhanmondi-32', location: [23.7461, 90.3752], address: 'Rd No 32, Dhanmondi, Dhaka', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.BIKE, pricePerHour: 30, features: ['CCTV'], operatingHours: '24/7', rating: 4.3, reviews: 50 },
  { id: 'dhk-4', name: 'Motijheel-01', location: [23.7277, 90.4191], address: 'Shapla Chattar, Motijheel, Dhaka', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.CAR, pricePerHour: 90, features: ['Guarded'], operatingHours: '9 AM - 9 PM', rating: 4.1, reviews: 95 },
  { id: 'dhk-5', name: 'Uttara-Jashimuddin', location: [23.8698, 90.3938], address: 'Jashimuddin Avenue, Uttara, Dhaka', status: ParkingSlotStatus.RESERVED, type: ParkingSlotType.MINIVAN, pricePerHour: 85, features: ['CCTV', 'Guarded'], operatingHours: '24/7', rating: 4.6, reviews: 120 },
  { id: 'dhk-6', name: 'Mirpur-Stadium', location: [23.8055, 90.3541], address: 'Sher-e-Bangla Stadium, Mirpur, Dhaka', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.SUV, pricePerHour: 110, features: ['Guarded', 'Valet parking'], operatingHours: 'Event-based', rating: 4.8, reviews: 200 },

  // Sylhet
  { id: 'syl-1', name: 'Zindabazar-01', location: [24.8949, 91.8687], address: 'Zindabazar Point, Sylhet', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.CAR, pricePerHour: 40, features: ['Guarded'], operatingHours: '8 AM - 10 PM', rating: 4.3, reviews: 15 },
  { id: 'syl-2', name: 'BlueWater-01', location: [24.8955, 91.8690], address: 'Blue Water Shopping City, Sylhet', status: ParkingSlotStatus.RESERVED, type: ParkingSlotType.SUV, pricePerHour: 50, features: ['Multi-storey parking'], operatingHours: '10 AM - 10 PM' },
  { id: 'syl-3', name: 'Ambarkhana-01', location: [24.9021, 91.8679], address: 'Ambarkhana Point, Sylhet', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.BIKE, pricePerHour: 15, features: [], operatingHours: '24/7' },
  { id: 'syl-4', name: 'Hotel Grand View', location: [24.8911, 91.8744], address: 'Taltola, Sylhet', status: ParkingSlotStatus.AVAILABLE, type: ParkingSlotType.CAR, pricePerHour: 60, features: ['CCTV', 'Valet parking'], operatingHours: '24/7' },
];

export const mockLocations: { name: string; location: [number, number]; category: string }[] = [
    // Chittagong
    { name: 'Chittagong University', location: [22.4637, 91.7959], category: 'University' },
    { name: 'Chittagong Medical College Hospital', location: [22.3552, 91.8229], category: 'Hospital' },
    { name: 'Zia Memorial Museum', location: [22.3582, 91.8218], category: 'Museum' },
    { name: 'Agrabad Children Park', location: [22.3331, 91.8101], category: 'Park' },
    { name: 'Port of Chittagong', location: [22.2858, 91.7915], category: 'Landmark' },
    { name: 'Nasirabad Govt. High School', location: [22.368, 91.832], category: 'School'},
    { name: 'Premier University', location: [22.36, 91.83], category: 'University'},
    // Dhaka
    { name: 'Dhaka University', location: [23.7346, 90.3927], category: 'University' },
    { name: 'Lalbagh Fort', location: [23.7191, 90.3883], category: 'Landmark' },
    { name: 'Bashundhara City Shopping Complex', location: [23.7519, 90.3905], category: 'Shopping Mall' },
    // Sylhet
    { name: 'Shahjalal University of Science and Technology', location: [24.9152, 91.8315], category: 'University' },
    { name: 'Hazrat Shahjalal Mazar Sharif', location: [24.8988, 91.8695], category: 'Landmark' },
];

export const mockReservations: Reservation[] = [
    {
        id: 'res-1',
        userId: 'user-1',
        slotId: 'ctg-3',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // ends in 1 hour
        totalCost: 60, // 3 hours * 20
        status: ReservationStatus.ACTIVE,
        paymentMethod: PaymentMethod.CARD,
    },
    {
        id: 'res-2',
        userId: 'user-2',
        slotId: 'ctg-10',
        startTime: new Date('2024-07-20T10:00:00Z'),
        endTime: new Date('2024-07-20T12:00:00Z'),
        totalCost: 160,
        status: ReservationStatus.COMPLETED,
        paymentMethod: PaymentMethod.BKASH,
    },
    {
        id: 'res-3',
        userId: 'user-1',
        slotId: 'syl-2',
        startTime: new Date('2024-07-19T15:00:00Z'),
        endTime: new Date('2024-07-19T18:00:00Z'),
        totalCost: 150,
        status: ReservationStatus.COMPLETED,
        paymentMethod: PaymentMethod.NAGAD,
    }
];


export const mockSystemLogs: SystemLog[] = [
  { id: 'log-1', timestamp: new Date(Date.now() - 3600000), userId: 'superadmin-1', action: 'ROLE_UPDATE', details: 'Changed role of user admin-2 to ADMIN.' },
  { id: 'log-2', timestamp: new Date(Date.now() - 7200000), userId: 'admin-1', action: 'SLOT_CREATED', details: 'Created new parking slot SYL-02.' },
  { id: 'log-3', timestamp: new Date(Date.now() - 86400000), userId: 'user-1', action: 'LOGIN_SUCCESS', details: 'User user-1 logged in successfully.' },
  { id: 'log-4', timestamp: new Date(), userId: 'user-2', action: 'RESERVATION_CANCELLED', details: 'User user-2 cancelled reservation for slot CTG-A1.' },
  { id: 'log-5', timestamp: new Date(), userId: 'admin-1', action: 'SLOT_DELETED', details: 'Deleted parking slot TEMP-01.' },
];
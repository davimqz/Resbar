// Enums
export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  PAID_PENDING_RELEASE = 'PAID_PENDING_RELEASE',
}

export enum TabStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
}

export enum MenuCategory {
  APPETIZER = 'APPETIZER',
  MAIN_COURSE = 'MAIN_COURSE',
  SIDE_DISH = 'SIDE_DISH',
  DESSERT = 'DESSERT',
  BEVERAGE = 'BEVERAGE',
  ALCOHOLIC_BEVERAGE = 'ALCOHOLIC_BEVERAGE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
}

export enum UserRole {
  STANDARD = 'STANDARD',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  ADMIN = 'ADMIN',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

// DTOs - Waiter
export interface WaiterDTO {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWaiterDTO {
  name: string;
  active?: boolean;
}

export interface UpdateWaiterDTO {
  name?: string;
  active?: boolean;
}

// DTOs - Table
export interface TableDTO {
  id: string;
  number: number;
  location: string | null;
  capacity: number;
  status: TableStatus;
  waiterId: string | null;
  waiter?: WaiterDTO;
  allTabsPaidAt: Date | null;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableDTO {
  number: number;
  location?: string;
  capacity?: number;
  waiterId?: string;
}

export interface UpdateTableDTO {
  number?: number;
  location?: string;
  capacity?: number;
  status?: TableStatus;
  waiterId?: string;
}

// DTOs - Person
export interface PersonDTO {
  id: string;
  name: string;
  tabId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonDTO {
  name: string;
  tableId: string;
}

// DTOs - Tab
export interface TabDTO {
  id: string;
  tableId: string;
  total: number;
  status: TabStatus;
  paymentMethod: PaymentMethod | null;
  paidAmount: number | null;
  changeAmount: number | null;
  person?: PersonDTO;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface TabWithOrdersDTO extends TabDTO {
  orders: OrderDTO[];
}

// DTOs - Order
export interface OrderDTO {
  id: string;
  tabId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  notes: string | null;
  menuItem?: MenuItemDTO;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDTO {
  tabId: string;
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface UpdateOrderDTO {
  quantity?: number;
  status?: OrderStatus;
  notes?: string;
}

// DTOs - MenuItem
export interface MenuItemDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: MenuCategory;
  available: boolean;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuItemDTO {
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  available?: boolean;
  imageUrl?: string;
}

export interface UpdateMenuItemDTO {
  name?: string;
  description?: string;
  price?: number;
  category?: MenuCategory;
  available?: boolean;
  imageUrl?: string;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Calculator types
export interface TabCalculation {
  tabId: string;
  personName: string;
  items: OrderDTO[];
  subtotal: number;
  total: number;
}

export interface TableCalculation {
  tableId: string;
  tableNumber: number;
  tabs: TabCalculation[];
  grandTotal: number;
}

// Payment types
export interface CloseTabDTO {
  paymentMethod: PaymentMethod;
  paidAmount: number;
}

// DTOs - User
export interface UserDTO {
  id: string;
  email: string;
  name: string;
  birthdate: Date | null;
  gender: Gender | null;
  customGender: string | null;
  role: UserRole;
  googleId: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  birthdate?: Date;
  gender?: Gender;
  customGender?: string;
  role?: UserRole;
  googleId?: string;
  avatar?: string;
}

export interface UpdateUserDTO {
  name?: string;
  birthdate?: Date;
  gender?: Gender;
  customGender?: string;
  role?: UserRole;
  avatar?: string;
}

export interface CompleteProfileDTO {
  name: string;
  birthdate: Date;
  gender: Gender;
  customGender?: string;
}

// DTOs - Auth
export interface LoginResponseDTO {
  user: UserDTO;
  accessToken: string;
}

export interface GoogleCallbackDTO {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

// DTOs - Inventory
export interface InventoryItemDTO {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryItemDTO {
  name: string;
  quantity?: number;
  unit: string;
  minStock?: number;
  category?: string;
}

export interface UpdateInventoryItemDTO {
  name?: string;
  quantity?: number;
  unit?: string;
  minStock?: number;
  category?: string;
}

// DTOs - Dashboard
export interface DashboardStatsDTO {
  dailyRevenue: number;
  ordersCount: {
    pending: number;
    preparing: number;
    ready: number;
    delivered: number;
  };
  tablesOccupied: number;
  popularItems: {
    itemId: string;
    itemName: string;
    totalSold: number;
    revenue: number;
  }[];
  waiterPerformance: {
    waiterId: string;
    waiterName: string;
    tablesServed: number;
    totalRevenue: number;
  }[];
}

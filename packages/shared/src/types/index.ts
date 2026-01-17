// Enums
export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
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

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ORDER_STATUS_LABELS = {
  PENDING: 'Pendente',
  PREPARING: 'Em Preparo',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
} as const;

export const TABLE_STATUS_LABELS = {
  AVAILABLE: 'Disponível',
  OCCUPIED: 'Ocupada',
  RESERVED: 'Reservada',
  PAID_PENDING_RELEASE: 'Aguardando Liberação',
} as const;

export const MENU_CATEGORY_LABELS = {
  APPETIZER: 'Entrada',
  MAIN_COURSE: 'Prato Principal',
  SIDE_DISH: 'Acompanhamento',
  DESSERT: 'Sobremesa',
  BEVERAGE: 'Bebida',
  ALCOHOLIC_BEVERAGE: 'Bebida Alcoólica',
} as const;

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
} as const;

export const USER_ROLE_LABELS = {
  STANDARD: 'Cliente',
  WAITER: 'Garçom',
  KITCHEN: 'Cozinha',
  ADMIN: 'Administrador',
} as const;

export const GENDER_LABELS = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
} as const;

// Lista predefinida de identidades de gênero para opção "Outro"
export const CUSTOM_GENDER_OPTIONS = [
  'Não-binário',
  'Gênero fluido',
  'Agênero',
  'Bigênero',
  'Pangênero',
  'Gênero queer',
  'Dois-espíritos',
  'Transgênero',
  'Prefiro não informar',
] as const;

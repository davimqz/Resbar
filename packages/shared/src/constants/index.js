export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const ORDER_STATUS_LABELS = {
    PENDING: 'Pendente',
    PREPARING: 'Em Preparo',
    READY: 'Pronto',
    DELIVERED: 'Entregue',
};
export const TABLE_STATUS_LABELS = {
    AVAILABLE: 'Disponível',
    OCCUPIED: 'Ocupada',
    RESERVED: 'Reservada',
    PAID_PENDING_RELEASE: 'Aguardando Liberação',
};
export const MENU_CATEGORY_LABELS = {
    APPETIZER: 'Entrada',
    MAIN_COURSE: 'Prato Principal',
    SIDE_DISH: 'Acompanhamento',
    DESSERT: 'Sobremesa',
    BEVERAGE: 'Bebida',
    ALCOHOLIC_BEVERAGE: 'Bebida Alcoólica',
};
export const PAYMENT_METHOD_LABELS = {
    CASH: 'Dinheiro',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    PIX: 'PIX',
};
export const USER_ROLE_LABELS = {
    STANDARD: 'Cliente',
    WAITER: 'Garçom',
    KITCHEN: 'Cozinha',
    ADMIN: 'Administrador',
};
export const GENDER_LABELS = {
    MALE: 'Masculino',
    FEMALE: 'Feminino',
    OTHER: 'Outro',
};
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
];
export const TAB_TYPE_LABELS = {
    TABLE: 'Mesa',
    COUNTER: 'Balcão',
};
// Códigos e símbolos de alergias
export const ALLERGEN_CODES = {
    GLUTEN: { symbol: '🌾', name: 'Glúten' },
    DAIRY: { symbol: '🥛', name: 'Laticínios' },
    EGGS: { symbol: '🥚', name: 'Ovos' },
    NUTS: { symbol: '🥜', name: 'Amendoim' },
    TREE_NUTS: { symbol: '🌰', name: 'Castanhas' },
    FISH: { symbol: '🐟', name: 'Peixes' },
    SHELLFISH: { symbol: '🦐', name: 'Frutos do Mar' },
    SOY: { symbol: '🫘', name: 'Soja' },
    SESAME: { symbol: '🌾', name: 'Gergelim' },
    SULFITES: { symbol: '🍷', name: 'Sulfitos' },
    CELERY: { symbol: '🥬', name: 'Aipo' },
    MUSTARD: { symbol: '🟡', name: 'Mostarda' },
    LUPIN: { symbol: '🌸', name: 'Tremoço' },
};
// Taxa de serviço padrão (10%)
export const DEFAULT_SERVICE_CHARGE_RATE = 0.1;
// Duração do intervalo do garçom (1 hora em milissegundos)
export const WAITER_BREAK_DURATION_MS = 60 * 60 * 1000;

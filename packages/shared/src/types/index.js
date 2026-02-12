// Enums
export var TableStatus;
(function (TableStatus) {
    TableStatus["AVAILABLE"] = "AVAILABLE";
    TableStatus["OCCUPIED"] = "OCCUPIED";
    TableStatus["RESERVED"] = "RESERVED";
    TableStatus["PAID_PENDING_RELEASE"] = "PAID_PENDING_RELEASE";
})(TableStatus || (TableStatus = {}));
export var TabStatus;
(function (TabStatus) {
    TabStatus["OPEN"] = "OPEN";
    TabStatus["CLOSED"] = "CLOSED";
})(TabStatus || (TabStatus = {}));
export var TabType;
(function (TabType) {
    TabType["TABLE"] = "TABLE";
    TabType["COUNTER"] = "COUNTER";
})(TabType || (TabType = {}));
export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY"] = "READY";
    OrderStatus["DELIVERED"] = "DELIVERED";
})(OrderStatus || (OrderStatus = {}));
export var MenuCategory;
(function (MenuCategory) {
    MenuCategory["APPETIZER"] = "APPETIZER";
    MenuCategory["MAIN_COURSE"] = "MAIN_COURSE";
    MenuCategory["SIDE_DISH"] = "SIDE_DISH";
    MenuCategory["DESSERT"] = "DESSERT";
    MenuCategory["BEVERAGE"] = "BEVERAGE";
    MenuCategory["ALCOHOLIC_BEVERAGE"] = "ALCOHOLIC_BEVERAGE";
})(MenuCategory || (MenuCategory = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["DEBIT_CARD"] = "DEBIT_CARD";
    PaymentMethod["PIX"] = "PIX";
})(PaymentMethod || (PaymentMethod = {}));
export var UserRole;
(function (UserRole) {
    UserRole["STANDARD"] = "STANDARD";
    UserRole["WAITER"] = "WAITER";
    UserRole["KITCHEN"] = "KITCHEN";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));
export var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
})(Gender || (Gender = {}));

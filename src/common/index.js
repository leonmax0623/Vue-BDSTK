export const BnStatusTicket = {
    Online: 10501,
    Offline: 10502,
}

export const ReportType = {
    Simple: 1,
    ByDate: 2,
    ByPeriod: 3,
}

export const ReportTypeName = {
    [ReportType.Simple]: 'Обычный отчет',
    [ReportType.ByDate]: 'Отчет на дату',
    [ReportType.ByPeriod]: 'Отчет за период',
}


export const PaymentType = {
    PeriodicPayment: 1,
    SinglePayment: 2
}

export const AddressType = {
    Channel: 1,
    Delivery: 2
}

export const PersonType = {
    Client: 1,
    Delivery: 2
}

export const StatusSIM = {
    Disabled: 1,
    SentToActivation: 2,
    Activated: 3,
    Blocked: 4,
    OnBlocking: 5,
    OFF: 6
}

export const SimStatusText = {
    Disabled: 'Не активна',
    SentToActivation: 'Отправлена на активацию',
    Activated: 'Активирована',
    Blocked: 'Заблокирована',
    OnBlocking: 'В процессе блокировки',
    OFF: 'Выведена из эксплуатации'
}

export const OrderStatusName = {
    Preparation: 'Подготовка заказа',
    Created: 'Заказ создан',
    OnSign: 'Заказ на подписании',
    Signed: 'Заказ подписан',
    SimOnActivation: 'Активация СИМ',
    SimActivated: 'СИМ активированы',
    HardwarePreparation: 'Подготовка оборудования',
    ReadyToDelivery: 'Готов к доставке',
    Delivery: 'Передан на доставку',
    ChannelEnabled: 'Канал включён',
    ChannelOnService: 'Канал передан на обслуживание',
    ChannelOffService: 'Канал снят с обслуживания',
    ChannelOnDisabling: 'Канал на отключении',
    ChannelDisabled: 'Канал отключен',
    ChannelOnTransfer: 'Перенос канала',
    ChannelTransfered: 'Канал перенесен',
    Canceled: 'Аннулирован',
    SimDelivered: 'СИМ доставлены',
    EquipDelivered: 'Оборудование доставлено',
    BNinStorage: 'БН на складе',
    DisabledAndSimBlocked: 'Канал отключен и СИМ заблокированы'
}

export const FileDirection = {
    download: 1,
    upload: 2,
    both: 3,
}

export const OrderStatus = {
    Preparation: 9,
    Created: 10,
    OnSign: 11,
    Signed: 12,
    SimOnActivation: 13,
    SimActivated: 14,
    HardwarePreparation: 15,
    ReadyToDelivery: 16,
    Delivery: 17,
    ChannelEnabled: 18,
    // ChannelOnService: 19,
    // ChannelOffService: 20,
    ChannelOnDisabling: 21,
    ChannelDisabled: 22,
    ChannelOnTransfer: 23,
    ChannelTransfered: 24,
    Canceled: 25,
    SimDelivered: 26,
    EquipDelivered: 27,
    BNinStorage: 28,
    DisabledAndSimBlocked: 29
}

export const OperatorType = {
    Beeline: 12,
    Megafon: 11,
    MTS: 10,
    Tele2: 13
}

export const OperatorFieldName = {
    [OperatorType.Beeline]: 'ТП Билайн',
    [OperatorType.Megafon]: 'ТП Мегафон',
    [OperatorType.MTS]: 'ТП МТС',
    [OperatorType.Tele2]: 'ТП Теле2'
}

export const ProductCategories = {
    Device: 1,
    Part: 2
}

export const ProductStatuses = {
    Storage: 1, //склад
    Repair: 2, //ремонт
    HandedToTheClient: 3, //передано клиенту
    Discarded: 4, //списано
    MadeToOrder: 5, //внесено в заказ
    RemovedFromOrder: 6 // убрано из заказа
}

export const InvoiceKind = {
    install: 1 //Инсталяционный счет
}

export const NotificationRemoveReason = {
    Auto: 1,
    ByUser: 2
}

export const ServiceType = {
    Sim: 14,
    Equipment: 13,
    AVR: 24,
}

// Local Map
export const ServiceCategory = {
    Sim: 'Sim',
    Equipment: 'Equipment',
    Channel: 'Channel',
    ChannelTransition: 'ChannelTransition',
    AVR: 'AVR',
    ZIP: 'Zip'
}

export const ServiceCategoryName = {
    [ServiceCategory.Sim]: 'Заказ на СИМ',
    [ServiceCategory.Equipment]: 'Заказ на Допоборудование',
    [ServiceCategory.Channel]: 'Заказ на канал',
    [ServiceCategory.ChannelTransition]: 'Перенос канала',
    [ServiceCategory.AVR]: 'АВР',
    [ServiceCategory.ZIP]: 'ЗИП',
}

export const getCategoryByService = order => {

    if(/зип/gi.test(order.comments)) {
        return ServiceCategory.ZIP
    }

    if(order.serviceType.id === ServiceType.Sim) {
        return ServiceCategory.Sim
    }

    if(order.serviceType.id === ServiceType.Equipment) {
        return ServiceCategory.Equipment
    }

    if(order.serviceType.id === ServiceType.AVR) {
        return ServiceCategory.AVR
    }

    if(order.linkOrderID) {
        return ServiceCategory.ChannelTransition
    }

    return ServiceCategory.Channel
}


export const DocumentType = {
    ActExpeditor: 1,
    Order: 2,
    Request: 3,
    ActPriemki: 4,
    ChannelPassport: 5,
    ActSdachiPriemki: 6,
    ActDostavki: 7,

    Custom: 10,
}
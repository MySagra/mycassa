// Daily Order type
export interface DailyOrder {
    id: string;
    displayCode: string;
    ticketNumber?: number | null;
    table: string;
    customer: string;
    createdAt: string;
    subTotal: string;
    total: string;
    status: string;
    orderStationStates?: Array<{
        id: string;
        status: string;
        orderId: string;
        stationId: string;
    }>;
}

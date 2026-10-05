export interface ShippingService {
    title: string;
    transitTime: string;
    notes: string;
    amount: number;
}

export interface ShippingQuote {
    currency: "INR";
    packageWeightKg: number;
    services: ShippingService[];
}

export interface OrderShipping extends ShippingService {
    countryCode: string;
    postcode: string;
    currency: "INR";
    packageWeightKg: number;
}
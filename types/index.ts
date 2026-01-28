export interface Volunteer {
    id: string;
    auth_id?: string; // Link to Supabase Auth User ID
    volunteer_id: string; // Custom Username
    name: string;
    email?: string;
    phone: string;
    role: 'volunteer';
    total_sales: number;
    created_at: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    total_orders: number;
    last_order_at?: string;
    created_at: string;
}

export interface Order {
    id: string;
    customer_id: string;
    volunteer_id?: string;
    product_name: string;
    quantity: number;
    total_price: number;
    payment_method: 'cod' | 'upi';
    payment_status: 'pending' | 'paid' | 'verified';
    order_status: 'pending' | 'confirmed' | 'delivered';
    payment_screenshot_url?: string;

    // Snapshot data
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string; // usually same as customer_phone
    customer_address: string;

    created_at: string;
    updated_at: string;

    // Joins
    customers?: Customer;
    volunteers?: Volunteer;
}

export interface ChallengeProgress {
    id: string;
    volunteer_id: string;
    confirmed_orders: number;
    goal: number;
    updated_at: string;
}

export interface Volunteer {
    id: string;
    auth_id?: string; // Link to Supabase Auth User ID
    volunteer_id: string; // Custom Username
    name: string;
    email?: string;
    phone: string;
    role: 'volunteer';
    total_sales: number;

    // Delivery & Commission tracking
    delivery_commission_per_bottle: number; // Default ₹10
    total_deliveries: number;
    total_delivery_commission: number; // For delivery duty
    total_referral_commission: number; // For referrals (separate)

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
    volunteer_id?: string; // Can be referral OR delivery volunteer (check is_delivery_duty)
    is_delivery_duty?: boolean; // TRUE = delivery volunteer, FALSE/NULL = referral volunteer
    product_name: string;
    quantity: number;
    total_price: number;
    delivery_fee?: number;

    // Payment
    payment_method?: 'qr' | 'razorpay' | 'volunteer_cash';
    payment_status: 'pending' | 'paid' | 'verified';
    payment_screenshot_url?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;

    // Order status (updated with payment_pending)
    order_status: 'payment_pending' | 'ordered' | 'delivered' | 'cant_reach' | 'cancelled';

    // Delivery method
    delivery_method?: 'volunteer' | 'post' | 'courier' | 'pickup';

    // Snapshot data
    customer_name: string;
    customer_phone: string;
    whatsapp_number: string;
    customer_address: string;

    created_at: string;
    updated_at: string;

    // Joins
    customers?: Customer;
    volunteers?: Volunteer; // Volunteer info (referral or delivery based on is_delivery_duty)
}

export interface DeliveryRequest {
    id: string;
    order_id: string;
    volunteer_id: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
    responded_at?: string;
    responded_by?: string; // Admin volunteer ID
    notes?: string;

    // Joins
    orders?: Order;
    volunteers?: Volunteer;
}

export interface ChallengeProgress {
    id: string;
    volunteer_id: string;
    confirmed_orders: number;
    goal: number;
    updated_at: string;
}

export interface PromoContent {
    id: string;
    title: string;
    type: 'video' | 'image' | 'youtube' | 'instagram';
    url: string;
    thumbnail_url?: string;
    aspect_ratio: '16:9' | '9:16' | '1:1' | '4:5';
    is_active: boolean;
    display_order: number;
    created_at: string;
}

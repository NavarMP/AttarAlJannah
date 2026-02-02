/**
 * Razorpay Configuration
 * 
 * Add the following to your .env.local file:
 * NEXT_PUBLIC_RAZORPAY_KEY_ID=your_test_key_id_here
 * RAZORPAY_KEY_SECRET=your_test_key_secret_here
 */

// Razorpay key loaded from environment
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

// Check if Razorpay is configured
export function isRazorpayConfigured(): boolean {
    return Boolean(RAZORPAY_KEY_ID);
}

/**
 * Load Razorpay script dynamically
 * @returns Promise that resolves when script is loaded
 */
export function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        // Check if script already loaded
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

/**
 * Razorpay payment options builder
 */
export interface RazorpayOptions {
    key: string;
    amount: number; // in paise (multiply by 100)
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color?: string;
    };
    handler: (response: RazorpayResponse) => void;
    modal?: {
        ondismiss?: () => void;
    };
}

export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

/**
 * Create Razorpay checkout options
 */
export function createRazorpayOptions(params: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    onSuccess: (response: RazorpayResponse) => void;
    onDismiss?: () => void;
}): RazorpayOptions {
    const { orderId, amount, customerName, customerEmail, customerPhone, onSuccess, onDismiss } = params;

    return {
        key: RAZORPAY_KEY_ID,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'Attar al-Jannah',
        description: 'عطر الجنّة (Attar Al Jannah) - Divine Fragrance',
        order_id: orderId,
        prefill: {
            name: customerName,
            email: customerEmail || '',
            contact: customerPhone,
        },
        notes: {
            product: 'Attar al-Jannah',
        },
        theme: {
            color: '#D4AF37', // Gold color matching your brand
        },
        handler: onSuccess,
        modal: {
            ondismiss: onDismiss,
        },
    };
}

/**
 * Open Razorpay payment checkout
 */
export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
    // Ensure script is loaded
    const isLoaded = await loadRazorpayScript();

    if (!isLoaded) {
        throw new Error('Failed to load Razorpay SDK');
    }

    if (!isRazorpayConfigured()) {
        throw new Error('Razorpay is not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID to your environment variables.');
    }

    // Create and open Razorpay instance
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
}

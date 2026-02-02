export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    name: string
                    phone: string
                    role: "admin" | "volunteer" | "customer"
                    address: string | null
                    total_sales: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone: string
                    role?: "admin" | "volunteer" | "customer"
                    address?: string | null
                    total_sales?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
                    role?: "admin" | "volunteer" | "customer"
                    address?: string | null
                    total_sales?: number
                    created_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    customer_id: string | null
                    referred_by: string | null
                    product_name: string
                    quantity: number
                    total_price: number
                    payment_method: "cod" | "upi"
                    payment_status: "pending" | "paid" | "verified"
                    order_status: "ordered" | "delivered" | "cant_reach" | "cancelled"
                    payment_screenshot_url: string | null
                    customer_name: string
                    customer_phone: string
                    customer_email: string | null
                    customer_address: string
                    whatsapp_number: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    customer_id?: string | null
                    referred_by?: string | null
                    product_name: string
                    quantity: number
                    total_price: number
                    payment_method: "cod" | "upi"
                    payment_status?: "pending" | "paid" | "verified"
                    order_status?: "ordered" | "delivered" | "cant_reach" | "cancelled"
                    payment_screenshot_url?: string | null
                    customer_name: string
                    customer_phone: string
                    customer_email?: string | null
                    customer_address: string
                    whatsapp_number: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    customer_id?: string | null
                    referred_by?: string | null
                    product_name?: string
                    quantity?: number
                    total_price?: number
                    payment_method?: "cod" | "upi"
                    payment_status?: "pending" | "paid" | "verified"
                    order_status?: "ordered" | "delivered" | "cant_reach" | "cancelled"
                    payment_screenshot_url?: string | null
                    customer_name?: string
                    customer_phone?: string
                    customer_email?: string | null
                    customer_address?: string
                    whatsapp_number?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            challenge_progress: {
                Row: {
                    id: string
                    volunteer_id: string
                    confirmed_orders: number
                    goal: number
                    updated_at: string
                }
                Insert: {
                    id?: string
                    volunteer_id: string
                    confirmed_orders?: number
                    goal?: number
                    updated_at?: string
                }
                Update: {
                    id?: string
                    volunteer_id?: string
                    confirmed_orders?: number
                    goal?: number
                    updated_at?: string
                }
            }
        }
    }
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type ChallengeProgress = Database["public"]["Tables"]["challenge_progress"]["Row"];

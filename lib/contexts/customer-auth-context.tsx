"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface CustomerAuthContextType {
    user: User | null;
    customerProfile: CustomerProfile | null;
    loading: boolean;
    signInWithPhone: (phone: string) => Promise<void>;
    verifyOTP: (phone: string, otp: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

interface CustomerProfile {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    default_address: string | null;
    total_orders: number;
    last_order_at: string | null;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchCustomerProfile = useCallback(async (phone: string) => {
        try {
            const response = await fetch(`/api/customer/profile?phone=${encodeURIComponent(phone)}`);
            if (response.ok) {
                const profile = await response.json();
                setCustomerProfile(profile);
            }
        } catch (error) {
            console.error("Failed to fetch customer profile:", error);
        }
    }, []);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchCustomerProfile(session.user.phone!);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchCustomerProfile(session.user.phone!);
            } else {
                setCustomerProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth, fetchCustomerProfile]);

    const signInWithPhone = async (phone: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            phone: `+91${phone}`,
        });
        if (error) throw error;
    };

    const verifyOTP = async (phone: string, otp: string) => {
        const { error } = await supabase.auth.verifyOtp({
            phone: `+91${phone}`,
            token: otp,
            type: 'sms',
        });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setCustomerProfile(null);
    };

    const refreshProfile = async () => {
        if (user?.phone) {
            await fetchCustomerProfile(user.phone);
        }
    };

    return (
        <CustomerAuthContext.Provider
            value={{
                user,
                customerProfile,
                loading,
                signInWithPhone,
                verifyOTP,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </CustomerAuthContext.Provider>
    );
}

export function useCustomerAuth() {
    const context = useContext(CustomerAuthContext);
    if (context === undefined) {
        throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
    }
    return context;
}

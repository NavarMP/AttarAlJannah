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
    loginWithPhone: (phone: string, createIfMissing?: boolean) => Promise<void>;
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
                if (profile) {
                    setCustomerProfile(profile);
                    if (profile.id) {
                        localStorage.setItem("customerUuid", profile.id);
                    }
                    return true;
                }
            }
            setCustomerProfile(null);
            return false;
        } catch (error) {
            console.error("Failed to fetch customer profile:", error);
            setCustomerProfile(null);
            return false;
        }
    }, []);

    useEffect(() => {
        // Check for stored phone in localStorage
        const storedPhone = localStorage.getItem("customerPhone");

        // Check active session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user && session.user.phone) {
                // Verify if this user has a valid customer profile
                const isValid = await fetchCustomerProfile(session.user.phone);
                if (isValid) {
                    setUser(session.user);
                } else {
                    // Start with basic user, assuming profile might be created later or is just missing
                    // BUT if we want to block Admin, we should technically not set User if invalid.
                    // However, blocking strictly might affect new signups?
                    // Safe bet: If user has 'customer' role in metadata? We don't have it.
                    // Given the bug "Admin opening dashboard": Admin has phone, but NO profile in users (role=customer).
                    // So isValid is false.
                    // So we do NOT setUser. Correct.
                    setUser(null);
                }
            } else if (storedPhone) {
                // Use stored phone for simple auth
                const isValid = await fetchCustomerProfile(storedPhone);
                if (isValid) {
                    setUser({ phone: storedPhone } as User);
                }
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user && session.user.phone) {
                const isValid = await fetchCustomerProfile(session.user.phone);
                if (isValid) {
                    setUser(session.user);
                } else {
                    setUser(null);
                    setCustomerProfile(null);
                }
            } else {
                // If Supabase session is null, check if we have a local phone session
                const storedPhone = localStorage.getItem("customerPhone");
                if (storedPhone) {
                    // Keep existing state if stored phone works (handled by init mostly, but here we can re-verify?)
                    // If we just logged out from Supabase (Admin), we shouldn't fallback to stored customer phone?
                    // Actually, if Admin logs out, session is null.
                    // If we have storedPhone, we might want to stay logged in as customer.
                    // But usually admin/customer don't mix on same browser seamlessly.
                    // Let's safe fallback.
                    setUser({ phone: storedPhone } as User);
                    fetchCustomerProfile(storedPhone);
                } else {
                    setUser(null);
                    setCustomerProfile(null);
                }
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
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error signing out from Supabase:", error);
        }
        // Always clear local state and ALL session keys
        setUser(null);
        setCustomerProfile(null);
        localStorage.removeItem("customerPhone");
        localStorage.removeItem("customerUuid");
        // Clear volunteer keys too since they share the same physical user contexts often
        localStorage.removeItem("volunteerId");
        localStorage.removeItem("volunteerName");
        localStorage.removeItem("volunteerUuid");
    };

    const loginWithPhone = async (phone: string, createIfMissing = true) => {
        // Phone already includes country code from the calling code
        // Store phone in localStorage for simple auth
        localStorage.setItem("customerPhone", phone);

        // Fetch or create customer profile
        const response = await fetch(`/api/customer/profile?phone=${encodeURIComponent(phone)}`);

        if (response.ok) {
            const profile = await response.json();
            if (profile) {
                setCustomerProfile(profile);
                // Save UUID for notifications/other usages
                if (profile.id) {
                    localStorage.setItem("customerUuid", profile.id);
                }
                setUser({ phone: phone } as User);
                return;
            }
        }

        // Profile not found
        if (createIfMissing) {
            // Create new profile
            const createResponse = await fetch('/api/customer/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone }),
            });

            if (createResponse.ok) {
                const profile = await createResponse.json();
                setCustomerProfile(profile);
                if (profile.id) {
                    localStorage.setItem("customerUuid", profile.id);
                }
                setUser({ phone: phone } as User);
            } else {
                // Clean up if creation failed
                localStorage.removeItem("customerPhone");
                throw new Error('Failed to create customer profile');
            }
        } else {
            // Clean up if creation not allowed and profile missing
            localStorage.removeItem("customerPhone");
            throw new Error('No customer found with this phone number');
        }
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
                loginWithPhone,
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

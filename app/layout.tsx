import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { CustomerAuthProvider } from "@/lib/contexts/customer-auth-context";
import { NotificationProvider } from "@/lib/contexts/notification-context";
import { Toaster } from "sonner";
import { CustomCursor } from "@/components/custom/custom-cursor";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#10b981" },
        { media: "(prefers-color-scheme: dark)", color: "#059669" },
    ],
};

export const metadata: Metadata = {
    title: "Attar al-Jannah | عطر الجنّة",
    description: "Premium Attar from Minhajul Janna - Join the sales challenge",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Attar Al Jannah",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: "/assets/icon-192.png",
        apple: "/assets/icon-192.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${GeistSans.className} antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <CustomerAuthProvider>
                            <NotificationProvider>
                                <SmoothScrollProvider>
                                    <CustomCursor />
                                    {children}
                                    <Toaster richColors position="top-center" />
                                </SmoothScrollProvider>
                            </NotificationProvider>
                        </CustomerAuthProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

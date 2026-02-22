import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Track Your Order | Attar al-Jannah",
    description: "Track your Attar al-Jannah order in real-time. Enter your Order ID to see delivery updates.",
    openGraph: {
        title: "Track Your Order | Attar al-Jannah",
        description: "Track your Attar al-Jannah order in real-time. Enter your Order ID to see delivery updates.",
    },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
    return children;
}

import useSWR from "swr";

interface LiveStats {
    totalOrders: number;
    averageRating: number;
    lastUpdated: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useLiveStats() {
    const { data, error, isLoading } = useSWR<LiveStats>(
        "/api/stats/live",
        fetcher,
        {
            refreshInterval: 10000, // 10 seconds (USER CHOICE)
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 5000, // Avoid duplicate requests within 5s
        }
    );

    return {
        stats: data,
        isLoading,
        isError: error,
    };
}
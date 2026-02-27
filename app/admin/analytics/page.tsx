"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { MetricCard } from "./components/shared/MetricCard";
import { DateRangeSelector, DatePreset } from "./components/shared/DateRangeSelector";
import { OrdersTimeline } from "./components/widgets/OrdersTimeline";
import { OrderStatusDonut } from "./components/widgets/OrderStatusDonut";
import { RevenueTimeline } from "./components/widgets/RevenueTimeline";
import { VolunteerLeaderboard } from "./components/widgets/VolunteerLeaderboard";
import { DeliveryZonesChart } from "./components/widgets/DeliveryZonesChart";
import { DeliverySuccessRate } from "./components/widgets/DeliverySuccessRate";
import { CustomerGrowthChart } from "./components/widgets/CustomerGrowthChart";
import { CustomerLifetimeValue } from "./components/widgets/CustomerLifetimeValue";
import { TopCustomersTable } from "./components/widgets/TopCustomersTable";
import { PerformanceDistributionChart } from "./components/widgets/PerformanceDistributionChart";
import { RevenueByZoneChart } from "./components/widgets/RevenueByZoneChart";
import { RevenueByAccountChart } from "./components/widgets/RevenueByAccountChart";
import { EnhancedLeaderboard } from "@/components/volunteer/enhanced-leaderboard";
import {
    TrendingUp,
    Package,
    Users,
    Target,
    CheckCircle,
    DollarSign,
    MapPin,
    TrendingDown,
    Truck,
    Clock,
} from "lucide-react";
import { toast } from "sonner";

interface DateRange {
    from: Date;
    to: Date;
}

interface OverviewMetrics {
    totalRevenue: number;
    revenueGrowth: number;
    activeOrders: number;
    ordersGrowth: number;
    volunteerPerformance: number;
    volunteerGrowth: number;
    customerSatisfaction: number;
    deliverySuccessRate: number;
    averageOrderValue: number;
    aovGrowth: number;
    activeZones: number;
    monthlyGrowth: number;
}

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [datePreset, setDatePreset] = useState<DatePreset>("30d");
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const to = new Date();
        to.setHours(23, 59, 59, 999);
        const from = new Date();
        from.setDate(to.getDate() - 30);
        from.setHours(0, 0, 0, 0);
        return { from, to };
    });

    const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [ordersData, setOrdersData] = useState<any>(null);
    const [volunteersData, setVolunteersData] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [deliveryData, setDeliveryData] = useState<any>(null);
    const [customersData, setCustomersData] = useState<any>(null);
    const [tabLoading, setTabLoading] = useState(false);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                start: dateRange.from.toISOString(),
                end: dateRange.to.toISOString(),
            });

            const response = await fetch(`/api/admin/analytics/overview?${params}`);
            if (!response.ok) throw new Error("Failed to fetch metrics");

            const data = await response.json();
            setMetrics(data.metrics);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    const fetchOrdersData = useCallback(async () => {
        setTabLoading(true);
        try {
            const params = new URLSearchParams({
                start: dateRange.from.toISOString(),
                end: dateRange.to.toISOString(),
            });
            const response = await fetch(`/api/admin/analytics/orders?${params}`);
            if (!response.ok) throw new Error("Failed to fetch orders data");
            const data = await response.json();
            setOrdersData(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to load orders analytics");
        } finally {
            setTabLoading(false);
        }
    }, [dateRange]);

    const fetchVolunteersData = useCallback(async () => {
        setTabLoading(true);
        try {
            const params = new URLSearchParams({
                start: dateRange.from.toISOString(),
                end: dateRange.to.toISOString(),
            });
            const response = await fetch(`/api/admin/analytics/volunteers?${params}`);
            if (!response.ok) throw new Error("Failed to fetch volunteers data");
            const data = await response.json();
            setVolunteersData(data);
        } catch (error) {
            console.error("Error fetching volunteers:", error);
            toast.error("Failed to load volunteers analytics");
        } finally {
            setTabLoading(false);
        }
    }, [dateRange]);

    const fetchRevenueData = useCallback(async () => {
        setTabLoading(true);
        try {
            const params = new URLSearchParams({
                start: dateRange.from.toISOString(),
                end: dateRange.to.toISOString(),
            });
            const response = await fetch(`/api/admin/analytics/revenue?${params}`);
            if (!response.ok) throw new Error("Failed to fetch revenue data");
            const data = await response.json();
            setRevenueData(data);
        } catch (error) {
            console.error("Error fetching revenue:", error);
            toast.error("Failed to load revenue analytics");
        } finally {
            setTabLoading(false);
        }
    }, [dateRange]);

    const fetchDeliveryData = useCallback(async () => {
        setTabLoading(true);
        try {
            const params = new URLSearchParams({
                start: dateRange.from.toISOString(),
                end: dateRange.to.toISOString(),
            });
            const response = await fetch(`/api/admin/analytics/delivery?${params}`);
            if (!response.ok) throw new Error("Failed to fetch delivery data");
            const data = await response.json();
            setDeliveryData(data);
        } catch (error) {
            console.error("Error fetching delivery:", error);
            toast.error("Failed to load delivery analytics");
        } finally {
            setTabLoading(false);
        }
    }, [dateRange]);

    const fetchCustomersData = useCallback(async () => {
        setTabLoading(true);
        try {
            const params = new URLSearchParams({
                start: dateRange.from.toISOString(),
                end: dateRange.to.toISOString(),
            });
            const response = await fetch(`/api/admin/analytics/customers?${params}`);
            if (!response.ok) throw new Error("Failed to fetch customers data");
            const data = await response.json();
            setCustomersData(data);
        } catch (error) {
            console.error("Error fetching customers:", error);
            toast.error("Failed to load customers analytics");
        } finally {
            setTabLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    useEffect(() => {
        if (activeTab === "orders" && !ordersData) {
            fetchOrdersData();
        } else if (activeTab === "volunteers" && !volunteersData) {
            fetchVolunteersData();
        } else if (activeTab === "revenue" && !revenueData) {
            fetchRevenueData();
        } else if (activeTab === "delivery" && !deliveryData) {
            fetchDeliveryData();
        } else if (activeTab === "customers" && !customersData) {
            fetchCustomersData();
        }
    }, [activeTab, ordersData, volunteersData, revenueData, deliveryData, customersData, fetchOrdersData, fetchVolunteersData, fetchRevenueData, fetchDeliveryData, fetchCustomersData]);

    return (
        <main className="min-h-screen p-4 sm:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard">
                            <Button variant="outline" className="rounded-2xl">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-pink-600 bg-clip-text text-transparent">
                                Analytics Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Comprehensive insights across all business dimensions
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchMetrics}
                            disabled={loading}
                            className="rounded-xl"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Date Range Selector */}
                <div className="flex justify-end">
                    <DateRangeSelector
                        value={dateRange}
                        onChange={setDateRange}
                        preset={datePreset}
                        onPresetChange={setDatePreset}
                    />
                </div>

                {/* Hero Metrics Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : metrics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="Net Profit"
                            value={`₹${metrics.totalRevenue.toLocaleString()}`}
                            icon={DollarSign}
                            color="green"
                            trend={{
                                value: metrics.revenueGrowth,
                                isPositive: metrics.revenueGrowth >= 0,
                            }}
                        />

                        <MetricCard
                            title="Active Orders"
                            value={metrics.activeOrders}
                            subtitle="Currently processing"
                            icon={Package}
                            color="blue"
                            trend={{
                                value: metrics.ordersGrowth,
                                isPositive: metrics.ordersGrowth >= 0,
                            }}
                        />

                        <MetricCard
                            title="Volunteer Performance"
                            value={`${metrics.volunteerPerformance}%`}
                            subtitle="Average efficiency"
                            icon={Users}
                            color="purple"
                            trend={{
                                value: metrics.volunteerGrowth,
                                isPositive: metrics.volunteerGrowth >= 0,
                            }}
                        />

                        <MetricCard
                            title="Customer Satisfaction"
                            value={`${metrics.customerSatisfaction}/5.0`}
                            subtitle="From feedback"
                            icon={Target}
                            color="pink"
                        />

                        <MetricCard
                            title="Delivery Success Rate"
                            value={`${metrics.deliverySuccessRate}%`}
                            subtitle="First-time success"
                            icon={CheckCircle}
                            color="green"
                        />

                        <MetricCard
                            title="Average Order Value"
                            value={`₹${metrics.averageOrderValue.toFixed(0)}`}
                            icon={TrendingUp}
                            color="blue"
                            trend={{
                                value: metrics.aovGrowth,
                                isPositive: metrics.aovGrowth >= 0,
                            }}
                        />

                        <MetricCard
                            title="Active Zones"
                            value={metrics.activeZones}
                            subtitle="Delivery coverage"
                            icon={MapPin}
                            color="amber"
                        />

                        <MetricCard
                            title="Monthly Growth"
                            value={`${metrics.monthlyGrowth >= 0 ? "+" : ""}${metrics.monthlyGrowth}%`}
                            subtitle="vs. last month"
                            icon={metrics.monthlyGrowth >= 0 ? TrendingUp : TrendingDown}
                            color={metrics.monthlyGrowth >= 0 ? "green" : "red"}
                        />
                    </div>
                ) : null}

                {/* Tabs Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-muted p-1 rounded-2xl">
                        <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
                        <TabsTrigger value="orders" className="rounded-xl">Orders</TabsTrigger>
                        <TabsTrigger value="volunteers" className="rounded-xl">Volunteers</TabsTrigger>
                        <TabsTrigger value="customers" className="rounded-xl">Customers</TabsTrigger>
                        <TabsTrigger value="delivery" className="rounded-xl">Delivery</TabsTrigger>
                        <TabsTrigger value="revenue" className="rounded-xl">Revenue</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg">Overview charts coming soon...</p>
                            <p className="text-sm mt-2">Select a specific tab to view detailed analytics</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="orders" className="space-y-6">
                        {tabLoading ? (
                            <div className="text-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground mt-4">Loading orders analytics...</p>
                            </div>
                        ) : ordersData ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <OrdersTimeline data={ordersData.timeline} />
                                    <OrderStatusDonut data={ordersData.statusDistribution} />
                                </div>
                                <TopCustomersTable data={ordersData.topCustomers || []} />
                            </div>
                        ) : null}
                    </TabsContent>

                    <TabsContent value="volunteers" className="space-y-6">
                        {tabLoading ? (
                            <div className="text-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground mt-4">Loading volunteers analytics...</p>
                            </div>
                        ) : volunteersData ? (
                            <div className="space-y-6">
                                {/* <VolunteerLeaderboard data={volunteersData.leaderboard} /> */}
                                < EnhancedLeaderboard />
                                <PerformanceDistributionChart data={volunteersData.performanceDistribution || []} />
                            </div>
                        ) : null}
                    </TabsContent>

                    <TabsContent value="customers" className="space-y-6">
                        {tabLoading ? (
                            <div className="text-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground mt-4">Loading customers analytics...</p>
                            </div>
                        ) : customersData ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <MetricCard
                                        title="Total Customers"
                                        value={customersData.metrics.totalCustomers}
                                        subtitle="In this period"
                                        icon={Users}
                                        color="blue"
                                    />
                                    <MetricCard
                                        title="New Customers"
                                        value={customersData.metrics.newCustomers}
                                        subtitle="First-time orders"
                                        icon={Target}
                                        color="green"
                                    />
                                    <MetricCard
                                        title="Repeat Purchase Rate"
                                        value={`${customersData.metrics.repeatPurchaseRate}%`}
                                        subtitle="Multiple orders"
                                        icon={TrendingUp}
                                        color="purple"
                                    />
                                    <MetricCard
                                        title="Avg Order Frequency"
                                        value={customersData.metrics.avgOrderFrequency}
                                        subtitle="Orders per customer"
                                        icon={Package}
                                        color="amber"
                                    />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <CustomerGrowthChart data={customersData.growth} />
                                    <CustomerLifetimeValue data={customersData.clvDistribution} />
                                </div>
                                <TopCustomersTable data={customersData.topCustomers} />
                            </div>
                        ) : null}
                    </TabsContent>

                    <TabsContent value="delivery" className="space-y-6">
                        {tabLoading ? (
                            <div className="text-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground mt-4">Loading delivery analytics...</p>
                            </div>
                        ) : deliveryData ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <MetricCard
                                        title="Pending Requests"
                                        value={deliveryData.metrics.pendingRequests}
                                        subtitle="Awaiting assignment"
                                        icon={Truck}
                                        color="amber"
                                    />
                                    <MetricCard
                                        title="Active Deliveries"
                                        value={deliveryData.metrics.activeDeliveries}
                                        subtitle="In transit"
                                        icon={Package}
                                        color="blue"
                                    />
                                    <MetricCard
                                        title="Completed"
                                        value={deliveryData.metrics.completedDeliveries}
                                        subtitle="In this period"
                                        icon={CheckCircle}
                                        color="green"
                                    />
                                    <MetricCard
                                        title="Avg Delivery Time"
                                        value={`${deliveryData.metrics.avgDeliveryTime}h`}
                                        subtitle="Order to delivery"
                                        icon={Clock}
                                        color="purple"
                                    />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <DeliverySuccessRate data={deliveryData.timeline || []} />
                                    <DeliveryZonesChart data={deliveryData.byZone || []} />
                                </div>
                            </div>
                        ) : null}
                    </TabsContent>

                    <TabsContent value="revenue" className="space-y-6">
                        {tabLoading ? (
                            <div className="text-center py-12">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground mt-4">Loading revenue analytics...</p>
                            </div>
                        ) : revenueData ? (
                            <div className="space-y-6">
                                <RevenueTimeline data={revenueData.timeline} />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <MetricCard
                                        title="Gross Revenue"
                                        value={`₹${revenueData.metrics.totalGrossRevenue.toLocaleString()}`}
                                        subtitle="₹313 per bottle"
                                        icon={DollarSign}
                                        color="blue"
                                    />
                                    <MetricCard
                                        title="Net Profit"
                                        value={`₹${revenueData.metrics.totalNetProfit.toLocaleString()}`}
                                        subtitle="₹200 per bottle"
                                        icon={TrendingUp}
                                        color="green"
                                    />
                                    <MetricCard
                                        title="Manufacturing Cost"
                                        value={`₹${revenueData.metrics.totalManufacturerCost.toLocaleString()}`}
                                        subtitle="₹113 per bottle"
                                        icon={Package}
                                        color="amber"
                                    />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <RevenueByZoneChart data={revenueData.revenueByZone || []} />
                                    <RevenueByAccountChart data={revenueData.byAccount || []} />
                                </div>
                            </div>
                        ) : null}
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}

import React, { useState, useEffect } from "react";
import { dashboardService } from "../services/dashboardService";
import { clientsService } from "../services/clientsService";
import { vouchersService } from "../services/vouchersService";
import { MetricCard } from "./MetricCard";
import { Users as UsersIcon, TrendingUp, DollarSign, AlertCircle, Plus, FileText, Download, CheckCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export const AccountantPortal = () => {
    const [metrics, setMetrics] = useState({
        totalClients: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        overduePayments: 0
    });
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [m, v] = await Promise.all([
                dashboardService.getAccountantMetrics(),
                vouchersService.getAll({ limit: 5 })
            ]);
            setMetrics(m);
            setVouchers(v);
        } catch (error) {
            toast.error("Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (voucher) => {
        try {
            await vouchersService.downloadPDF(voucher.id, voucher.voucherNumber);
            toast.success("Voucher PDF downloaded");
        } catch (error) {
            toast.error("Failed to download PDF");
        }
    };

    const statusColors = {
        paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading accountant portal...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Clients"
                    value={metrics.totalClients}
                    icon={UsersIcon}
                    gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <MetricCard
                    title="Total Revenue"
                    value={`$${metrics.totalRevenue.toLocaleString()}`}
                    icon={TrendingUp}
                    gradient="bg-gradient-to-br from-green-500 to-green-600"
                />
                <MetricCard
                    title="Pending Payments"
                    value={`$${metrics.pendingPayments.toLocaleString()}`}
                    icon={DollarSign}
                    gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
                />
                <MetricCard
                    title="Overdue Vouchers"
                    value={metrics.overduePayments}
                    icon={AlertCircle}
                    gradient="bg-gradient-to-br from-red-500 to-red-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            Recent Vouchers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Voucher #</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vouchers.map((v) => (
                                    <TableRow key={v.id}>
                                        <TableCell>{v.voucherNumber}</TableCell>
                                        <TableCell>{v.clientName}</TableCell>
                                        <TableCell>${parseFloat(v.amount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[v.status]}>
                                                {v.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(v)}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Placeholder for Revenue Chart */}
                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Revenue Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Paid', value: metrics.totalRevenue }, { name: 'Pending', value: metrics.pendingPayments }]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

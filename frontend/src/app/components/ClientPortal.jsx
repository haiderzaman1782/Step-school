import React, { useState, useEffect } from "react";
import { dashboardService } from "../services/dashboardService";
import { vouchersService } from "../services/vouchersService";
import { MetricCard } from "./MetricCard";
import { FileText, DollarSign, Calendar, Clock, Download, ChevronRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

export const ClientPortal = () => {
    const [metrics, setMetrics] = useState({
        totalPaid: 0,
        pendingAmount: 0,
        nextDueDate: null
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
                dashboardService.getClientMetrics(),
                vouchersService.getAll({ limit: 10 })
            ]);
            setMetrics(m);
            setVouchers(v);
        } catch (error) {
            toast.error("Failed to fetch account data");
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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your portal...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Paid"
                    value={`$${metrics.totalPaid.toLocaleString()}`}
                    icon={CheckCircle}
                    gradient="bg-gradient-to-br from-green-500 to-green-600"
                />
                <MetricCard
                    title="Pending Amount"
                    value={`$${metrics.pendingAmount.toLocaleString()}`}
                    icon={Clock}
                    gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
                />
                <MetricCard
                    title="Next Due Date"
                    value={metrics.nextDueDate ? new Date(metrics.nextDueDate).toLocaleDateString() : "N/A"}
                    icon={Calendar}
                    gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                />
            </div>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold">My Payment Vouchers</CardTitle>
                    <FileText className="w-5 h-5 text-gray-400" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Voucher #</TableHead>
                                    <TableHead>Service / Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="pr-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vouchers.map((v) => (
                                    <TableRow key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <TableCell className="pl-6 font-medium">{v.voucherNumber}</TableCell>
                                        <TableCell>{v.paymentTypeName}</TableCell>
                                        <TableCell className="font-bold">${parseFloat(v.amount).toFixed(2)}</TableCell>
                                        <TableCell>{new Date(v.dueDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[v.status]}>
                                                {v.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownloadPDF(v)}>
                                                <Download className="w-4 h-4" />
                                                PDF
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {vouchers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                            No vouchers found in your account.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { ExportDropdown } from "./ExportDropdown.jsx";
import { ExportConfigModal } from "./ExportConfigModal.jsx";
import { exportToCSV, exportToPDF, formatDateForExport, formatDateTimeForExport } from "../utils/exportUtils.js";
import { calculateWeeklyRevenue, calculateMonthlyRevenue, calculateYearlyRevenue } from "../utils/chartDataUtils.js";
import {
  DollarSign,
  CircleCheck,
  Clock,
  CircleX,
  Search,
  Eye,
  RotateCcw,
  CreditCard,
  Calendar,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { MetricCard } from "./MetricCard.jsx";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { DialogFooter } from "./ui/dialog.jsx";
import { Plus } from "lucide-react";
import { paymentsService } from "../services/paymentsService";

const statusColors = {
  paid: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  failed: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const statusIcons = {
  paid: CircleCheck,
  pending: Clock,
  failed: CircleX,
};

const paymentMethodIcons = {
  Stripe: CreditCard,
  Card: CreditCard,
  Cash: DollarSign,
  Other: CreditCard,
};

export function Payments({ payments, onPaymentCreated, onStatusUpdate }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("weekly");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exportScope, setExportScope] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    customerName: '',
    paymentMethod: 'Stripe',
    amount: '',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    service: '',
    invoiceNumber: '',
    callReference: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      const updatedPayment = await paymentsService.update(paymentId, { status: newStatus });
      if (onStatusUpdate) {
        onStatusUpdate(paymentId, newStatus);
      }
      toast.success("Payment status updated", {
        description: `Status changed to ${newStatus}`,
      });
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Calculate metrics from database payments
  const totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const paidPayments = payments.filter(p => p.status === "paid");
  const paidAmount = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const pendingPayments = payments.filter(p => p.status === "pending");
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const failedPayments = payments.filter(p => p.status === "failed");
  const failedAmount = failedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.callReference?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    let matchesDate = true;
    if (dateFilter === "today") {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = payment.date === today;
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(payment.date) >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(payment.date) >= monthAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);



  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };

  const handleRefund = (payment) => {
    if (payment.status !== "paid") {
      toast.error("Only paid payments can be refunded");
      return;
    }

    toast.success("Refund initiated", {
      description: `Refund of $${payment.amount} for ${payment.customerName} is being processed`,
      duration: 5000,
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle row selection
  const handleSelectRow = (paymentId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredPayments.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredPayments.map(p => p.id)));
    }
  };

  // Get data to export based on scope
  const getExportData = () => {
    let dataToExport = [];
    if (exportScope === "selected") {
      dataToExport = filteredPayments.filter(p => selectedRows.has(p.id));
    } else if (exportScope === "filtered") {
      dataToExport = filteredPayments;
    } else {
      dataToExport = payments;
    }
    return dataToExport;
  };

  // Export columns configuration
  const exportColumns = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "invoiceNumber", label: "Invoice #" },
    { key: "callReference", label: "Call Ref" },
    // { key: "id", label: "Payment ID" },
    { key: "customerName", label: "Customer Name" },
    { key: "paymentMethod", label: "Payment Method" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
    // { key: "timestamp", label: "Date & Time" },
    // { key: "refundStatus", label: "Refund Status" },
  ];

  // Handle export
  const handleExport = async (format) => {
    setSelectedFormat(format);
    setExportScope(
      selectedRows.size > 0 ? "selected" :
        (searchQuery || statusFilter !== "all" || dateFilter !== "all") ? "filtered" : "all"
    );
    setShowExportModal(true);
  };

  // Handle create payment
  const handleCreatePayment = async () => {
    if (!newPayment.customerName || !newPayment.amount || !newPayment.paymentMethod) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      const created = await paymentsService.create({
        customerName: newPayment.customerName,
        paymentMethod: newPayment.paymentMethod,
        amount: parseFloat(newPayment.amount),
        status: newPayment.status,
        date: newPayment.date,
        service: newPayment.service,
        invoiceNumber: newPayment.invoiceNumber,
        callReference: newPayment.callReference,
      });
      if (onPaymentCreated) {
        onPaymentCreated(created);
      }
      setIsCreateDialogOpen(false);
      setNewPayment({ customerName: '', paymentMethod: 'Stripe', amount: '', status: 'pending', date: new Date().toISOString().split('T')[0], service: '', invoiceNumber: '', callReference: '' });
      toast.success("Payment created successfully");
    } catch (error) {
      toast.error("Failed to create payment");
    }
  };

  const handleExportConfirm = async (config) => {
    setIsExporting(true);
    try {
      // Use scope from config if provided, otherwise use current exportScope
      const scopeToUse = config.exportScope || exportScope;
      let dataToExport = [];
      if (scopeToUse === "selected") {
        dataToExport = filteredPayments.filter(p => selectedRows.has(p.id));
      } else if (scopeToUse === "filtered") {
        dataToExport = filteredPayments;
      } else {
        dataToExport = payments; // All records
      }

      // Filter by date range if provided
      let filteredData = dataToExport;
      if (config.startDate || config.endDate) {
        filteredData = dataToExport.filter(p => {
          const paymentDate = new Date(p.timestamp || p.date);
          if (config.startDate && paymentDate < new Date(config.startDate)) return false;
          if (config.endDate && paymentDate > new Date(config.endDate)) return false;
          return true;
        });
      }

      // Filter columns
      const selectedColumns = exportColumns.filter(col => config.columns.includes(col.key));

      // Prepare data with formatted values
      const formattedData = filteredData.map(payment => {
        const row = {};
        selectedColumns.forEach(col => {
          switch (col.key) {
            case "transactionId":
              row[col.key] = payment.transactionId || payment.id;
              break;
            case "date":
              row[col.key] = formatDateForExport(payment.date);
              break;
            case "timestamp":
              row[col.key] = payment.timestamp ? formatDateTimeForExport(payment.timestamp) : formatDateForExport(payment.date);
              break;
            case "amount":
              row[col.key] = `$${payment.amount.toFixed(2)}`;
              break;
            case "status":
              row[col.key] = payment.status.charAt(0).toUpperCase() + payment.status.slice(1);
              break;
            case "refundStatus":
              row[col.key] = payment.refundStatus || "N/A";
              break;
            default:
              row[col.key] = payment[col.key] || "N/A";
          }
        });
        return row;
      });

      if (config.format === "csv") {
        exportToCSV(formattedData, selectedColumns, "payments");
        toast.success("Payments exported successfully!", {
          description: `${formattedData.length} records exported as CSV`,
        });
      } else if (config.format === "pdf") {
        const totalAmount = filteredData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const summaryData = config.includeSummary ? {
          "Total Transactions": formattedData.length,
          "Total Amount": `$${totalAmount.toFixed(2)}`,
          "Paid": formattedData.filter(d => d.status === "Paid").length,
          "Pending": formattedData.filter(d => d.status === "Pending").length,
          "Failed": formattedData.filter(d => d.status === "Failed").length,
        } : null;

        await exportToPDF(
          formattedData,
          selectedColumns,
          {
            filename: "payments",
            title: "Payments Report",
            orientation: config.orientation,
            includeSummary: config.includeSummary,
            summaryData,
          }
        );
        toast.success("Payments exported successfully!", {
          description: `${formattedData.length} records exported as PDF`,
        });
      }

      setShowExportModal(false);
    } catch (error) {
      toast.error("Export failed", {
        description: error.message || "An error occurred while exporting data",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Chart data - calculated from database payments
  const revenueData = chartPeriod === "weekly"
    ? calculateWeeklyRevenue(payments)
    : chartPeriod === "monthly"
      ? calculateMonthlyRevenue(payments)
      : calculateYearlyRevenue(payments);

  const paymentStatusData = [
    { name: "Paid", value: paidPayments.length, color: "#10b981" },
    { name: "Pending", value: pendingPayments.length, color: "#f59e0b" },
    { name: "Failed", value: failedPayments.length, color: "#ef4444" }
  ];

  // Group payment methods: Cards (Credit Card, Debit Card) and Other (transfers like Mobile Payment, Bank Transfer, PayPal, etc.)
  const cardMethods = ["Credit Card", "Debit Card"];
  const transferMethods = ["Mobile Payment", "Bank Transfer", "PayPal"];

  const paymentMethodData = [
    {
      name: "Cards",
      value: payments.filter(p => cardMethods.includes(p.paymentMethod)).length,
      color: "#3b82f6"
    },
    {
      name: "Cash",
      value: payments.filter(p => p.paymentMethod === "Cash").length,
      color: "#8b5cf6"
    },
    {
      name: "Other",
      value: payments.filter(p =>
        transferMethods.includes(p.paymentMethod) ||
        (!cardMethods.includes(p.paymentMethod) && p.paymentMethod !== "Cash" && p.paymentMethod !== "Stripe" && p.paymentMethod !== "Card")
      ).length,
      color: "#f59e0b"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Failed Payments Alert Banner */}
      {failedPayments.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 dark:text-red-300">
                  {failedPayments.length} Failed Payment{failedPayments.length > 1 ? 's' : ''} Require Attention
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Total failed amount: ${failedAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          change={`${payments.length} transactions`}
          changeType="positive"
          icon={DollarSign}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Paid Payments"
          value={`$${paidAmount.toFixed(2)}`}
          change={`${paidPayments.length} completed`}
          changeType="positive"
          icon={CircleCheck}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Pending Payments"
          value={`$${pendingAmount.toFixed(2)}`}
          change={`${pendingPayments.length} awaiting`}
          changeType="neutral"
          icon={Clock}
          gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <MetricCard
          title="Failed Payments"
          value={`$${failedAmount.toFixed(2)}`}
          change={`${failedPayments.length} failed`}
          changeType="negative"
          icon={CircleX}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
      </div>

      {/* Payment Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="dark:text-white">Revenue Analytics</CardTitle>
                <Select value={chartPeriod} onValueChange={setChartPeriod}>
                  <SelectTrigger className="w-[120px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                      tick={{ fill: '#6b7280' }}
                      style={{ fill: '#6b7280' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                      tick={{ fill: '#6b7280' }}
                      style={{ fill: '#6b7280' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const isDark = document.documentElement.classList.contains('dark');
                          return (
                            <div
                              className="rounded-lg border p-3 shadow-md"
                              style={{
                                backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
                                borderColor: isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)',
                                color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)'
                              }}
                            >
                              <p className="font-medium mb-2">{payload[0].payload.name}</p>
                              {payload.map((entry, index) => (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  {entry.name === 'revenue' ? `Revenue: $${parseFloat(entry.value).toFixed(2)}` : `${entry.name}: ${entry.value}`}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#6b7280' }} className="dark:[&_text]:fill-gray-400" />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-2">No revenue data available</p>
                    <p className="text-sm">
                      {payments.length === 0
                        ? "No payments found in database"
                        : "No payments found in the selected period"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Distribution */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
          <CardHeader>
            <CardTitle className="dark:text-white">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Chart */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
        <CardHeader>
          <CardTitle className="dark:text-white">Payment Methods Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentMethodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-gray-400" />
              <YAxis stroke="#6b7280" className="dark:stroke-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">Payment Transactions</CardTitle>
              <ExportDropdown
                onExport={handleExport}
                disabled={filteredPayments.length === 0}
                isLoading={isExporting}
                exportScope={exportScope}
                hasSelectedRows={selectedRows.size > 0}
                hasFilters={searchQuery || statusFilter !== "all" || dateFilter !== "all"}
              />
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by customer, transaction ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[150px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.size === paginatedPayments.length && paginatedPayments.length > 0 && paginatedPayments.every(p => selectedRows.has(p.id))}
                      onCheckedChange={() => {
                        if (selectedRows.size === paginatedPayments.length && paginatedPayments.every(p => selectedRows.has(p.id))) {
                          // Deselect all paginated items
                          setSelectedRows(prev => {
                            const newSet = new Set(prev);
                            paginatedPayments.forEach(p => newSet.delete(p.id));
                            return newSet;
                          });
                        } else {
                          // Select all paginated items
                          setSelectedRows(prev => {
                            const newSet = new Set(prev);
                            paginatedPayments.forEach(p => newSet.add(p.id));
                            return newSet;
                          });
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Transaction ID</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Customer</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Service</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Payment Method</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Amount</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Status</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Date & Time</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow className="dark:border-gray-700">
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayments.map((payment) => {
                    const StatusIcon = statusIcons[payment.status];
                    const MethodIcon = paymentMethodIcons[payment.paymentMethod] || CreditCard;

                    return (
                      <TableRow
                        key={payment.id}
                        className={`dark:border-gray-700 ${payment.status === "failed"
                          ? "bg-red-50/50 dark:bg-red-900/10"
                          : ""
                          }`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(payment.id)}
                            onCheckedChange={() => handleSelectRow(payment.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium dark:text-gray-300 whitespace-nowrap">
                          {payment.transactionId || payment.id}
                        </TableCell>
                        <TableCell className="dark:text-gray-300 whitespace-nowrap">
                          {payment.customerName || "N/A"}
                        </TableCell>
                        <TableCell className="dark:text-gray-300 whitespace-nowrap">
                          {payment.service || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MethodIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="dark:text-gray-300">{payment.paymentMethod || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold dark:text-gray-300 whitespace-nowrap">
                          ${payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={payment.status}
                            onValueChange={(newStatus) => handleStatusUpdate(payment.id, newStatus)}
                          >
                            <SelectTrigger className={`w-[140px] h-8 text-xs border ${statusColors[payment.status]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="dark:text-gray-300 whitespace-nowrap text-sm">
                          {payment.timestamp ? formatTimestamp(payment.timestamp) : formatDate(payment.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPayment(payment)}
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {payment.status === "paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefund(payment)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredPayments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                  <SelectTrigger className="w-[80px] h-8 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of {filteredPayments.length} entries
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 ${currentPage === pageNum
                          ? "dark:bg-blue-600 dark:text-white"
                          : "dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                          }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Payment Details</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Complete information for transaction {selectedPayment?.transactionId || selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6 mt-4">
              {/* Payment Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID</p>
                  <p className="text-sm font-semibold dark:text-gray-300">{selectedPayment.transactionId || selectedPayment.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Invoice Number</p>
                  <p className="text-sm font-semibold dark:text-gray-300">{selectedPayment.invoiceNumber || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">${selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <Badge
                    variant="outline"
                    className={`${statusColors[selectedPayment.status]} flex items-center gap-1 w-fit`}
                  >
                    {React.createElement(statusIcons[selectedPayment.status], { className: "w-3 h-3" })}
                    <span className="capitalize">{selectedPayment.status}</span>
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Method</p>
                  <div className="flex items-center gap-2">
                    {React.createElement(paymentMethodIcons[selectedPayment.paymentMethod] || CreditCard, { className: "w-4 h-4 text-gray-500 dark:text-gray-400" })}
                    <p className="text-sm dark:text-gray-300">{selectedPayment.paymentMethod || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date & Time</p>
                  <p className="text-sm dark:text-gray-300">
                    {selectedPayment.timestamp ? formatTimestamp(selectedPayment.timestamp) : formatDate(selectedPayment.date)}
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold mb-3 dark:text-white">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customer Name</p>
                    <p className="text-sm dark:text-gray-300">{selectedPayment.customerName || "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Service</p>
                    <p className="text-sm dark:text-gray-300">{selectedPayment.service || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              {selectedPayment.appointmentId && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Appointment Details
                  </h3>
                  {(() => {
                    const appointment = getAppointmentDetails(selectedPayment.appointmentId);
                    return appointment ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Appointment ID</p>
                          <p className="text-sm dark:text-gray-300">{appointment.id}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</p>
                          <p className="text-sm dark:text-gray-300">{formatDate(appointment.date)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Time</p>
                          <p className="text-sm dark:text-gray-300">{appointment.time}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                          <Badge variant="outline" className="w-fit capitalize dark:text-gray-300">
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Appointment details not available</p>
                    );
                  })()}
                </div>
              )}

              {/* Call Reference */}
              {selectedPayment.callReference && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Call Reference
                  </h3>
                  <p className="text-sm dark:text-gray-300">{selectedPayment.callReference}</p>
                </div>
              )}

              {/* Failure Reason */}
              {selectedPayment.status === "failed" && selectedPayment.failureReason && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2 text-red-600 ">
                    <AlertCircle className="w-4 h-4" />
                    Failure Reason
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400">{selectedPayment.failureReason}</p>
                </div>
              )}

              {/* Invoice Summary */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Invoice Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-sm font-semibold dark:text-gray-300">${selectedPayment.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="text-sm font-semibold dark:text-gray-300">$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold dark:text-white">Total</span>
                      <span className="text-lg font-bold dark:text-white">${selectedPayment.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add New Payment</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Record a new payment transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Customer Name *</label>
                <Input
                  placeholder="Enter customer name"
                  value={newPayment.customerName}
                  onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })}
                  className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium dark:text-gray-300">Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Payment Method *</label>
                <Select value={newPayment.paymentMethod} onValueChange={(value) => setNewPayment({ ...newPayment, paymentMethod: value })}>
                  <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="Stripe">Stripe</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Service</label>
                <Input
                  placeholder="Enter service name"
                  value={newPayment.service}
                  onChange={(e) => setNewPayment({ ...newPayment, service: e.target.value })}
                  className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Date</label>
                <Input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Status</label>
                <Select value={newPayment.status} onValueChange={(value) => setNewPayment({ ...newPayment, status: value })}>
                  <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewPayment({ customerName: '', paymentMethod: 'Stripe', amount: '', status: 'pending', date: new Date().toISOString().split('T')[0], service: '', invoiceNumber: '', callReference: '' });
              }}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePayment}>
              Create Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Configuration Modal */}
      <ExportConfigModal
        key={`export-modal-${selectedFormat}-${showExportModal}`}
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onConfirm={handleExportConfirm}
        columns={exportColumns}
        defaultFormat={selectedFormat}
        showDateRange={true}
        showColumnSelection={true}
        showSummaryOption={true}
        showScopeSelection={true}
        defaultScope={exportScope}
        hasSelectedRows={selectedRows.size > 0}
        hasFilters={searchQuery || statusFilter !== "all" || dateFilter !== "all"}
      />
    </div>
  );
}


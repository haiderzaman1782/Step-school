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
  ChevronRight,
  Phone
} from "lucide-react";
import { MetricCard } from "./MetricCard.jsx";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { DialogFooter } from "./ui/dialog.jsx";
import { Plus } from "lucide-react";
import { vouchersService } from "../services/vouchersService";
import { clientsService } from "../services/clientsService";
import { paymentTypesService } from "../services/paymentTypesService";

const statusColors = {
  paid: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  overdue: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const statusIcons = {
  paid: CircleCheck,
  pending: Clock,
  overdue: CircleX,
};

export function Payments({ userRole }) {
  const [vouchers, setVouchers] = useState([]);
  const [clients, setClients] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("weekly");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exportScope, setExportScope] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    clientId: '',
    paymentTypeId: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'pending',
    attachment: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vouchersData, clientsData, typesData] = await Promise.all([
        vouchersService.getAll(),
        clientsService.getAll(),
        paymentTypesService.getAll()
      ]);
      setVouchers(vouchersData);
      setClients(clientsData.users || []);
      setPaymentTypes(typesData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await vouchersService.updateStatus(id, { status: newStatus });
      setVouchers(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Metrics calculation
  const totalAmount = vouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
  const paidVouchers = vouchers.filter(v => v.status === "paid");
  const paidAmount = paidVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
  const pendingVouchers = vouchers.filter(v => v.status === "pending");
  const pendingAmount = pendingVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);
  const overdueVouchers = vouchers.filter(v => v.status === "overdue");
  const overdueAmount = overdueVouchers.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);

  // Filter logic
  const filteredPayments = vouchers.filter(v => {
    const matchesSearch =
      (v.voucher_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.client_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

    return matchesSearch && matchesStatus;
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
      dataToExport = vouchers;
    }
    return dataToExport;
  };

  // Export columns configuration
  const exportColumns = [
    { key: "voucher_number", label: "Voucher #" },
    { key: "client_name", label: "Client Name" },
    { key: "payment_type_name", label: "Payment Type" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "due_date", label: "Due Date" },
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

  // Handle create voucher
  const handleCreateVoucher = async () => {
    if (!newVoucher.clientId || !newVoucher.amount || !newVoucher.paymentTypeId) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('clientId', newVoucher.clientId);
      formData.append('paymentTypeId', newVoucher.paymentTypeId);
      formData.append('amount', parseFloat(newVoucher.amount));
      formData.append('dueDate', newVoucher.dueDate);
      formData.append('description', newVoucher.description || '');
      formData.append('status', newVoucher.status);
      if (newVoucher.attachment) {
        formData.append('attachment', newVoucher.attachment);
      }

      await vouchersService.create(formData);

      setIsCreateDialogOpen(false);
      setNewVoucher({
        clientId: '',
        paymentTypeId: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        description: '',
        status: 'pending',
        attachment: null
      });
      toast.success("Voucher created successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to create voucher");
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
        dataToExport = vouchers; // All records
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
              row[col.key] = payment.voucher_number || payment.id;
              break;
            case "date":
            case "due_date":
              row[col.key] = formatDateForExport(payment.due_date);
              break;
            case "amount":
              row[col.key] = `$${parseFloat(payment.amount).toFixed(2)}`;
              break;
            case "status":
              row[col.key] = payment.status.charAt(0).toUpperCase() + payment.status.slice(1);
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
            filename: "vouchers",
            title: "Vouchers Report",
            orientation: config.orientation,
            includeSummary: config.includeSummary,
            summaryData,
          }
        );
        toast.success("Vouchers exported successfully!", {
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

  // Chart data - calculated from database vouchers
  const revenueData = chartPeriod === "weekly"
    ? calculateWeeklyRevenue(vouchers)
    : chartPeriod === "monthly"
      ? calculateMonthlyRevenue(vouchers)
      : calculateYearlyRevenue(vouchers);

  const paymentStatusData = [
    { name: "Paid", value: paidVouchers.length, color: "#10b981" },
    { name: "Pending", value: pendingVouchers.length, color: "#f59e0b" },
    { name: "Overdue", value: overdueVouchers.length, color: "#ef4444" }
  ];

  // Group payment methods based on payment type names from vouchers
  const paymentMethodData = Array.from(
    vouchers.reduce((acc, v) => {
      const type = v.paymentTypeName || "Other";
      acc.set(type, (acc.get(type) || 0) + 1);
      return acc;
    }, new Map())
  ).map(([name, value]) => ({
    name,
    value,
    color: "#3b82f6" // Default color, could be mapped
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overdue Vouchers Alert Banner */}
      {overdueVouchers.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 dark:text-red-300">
                  {overdueVouchers.length} Overdue Voucher{overdueVouchers.length > 1 ? 's' : ''} Require Attention
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Total overdue amount: ${overdueAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Amount"
          value={`$${totalAmount.toFixed(2)}`}
          change={`${vouchers.length} vouchers`}
          changeType="neutral"
          icon={DollarSign}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Paid Vouchers"
          value={`$${paidAmount.toFixed(2)}`}
          change={`${paidVouchers.length} completed`}
          changeType="positive"
          icon={CircleCheck}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Pending Vouchers"
          value={`$${pendingAmount.toFixed(2)}`}
          change={`${pendingVouchers.length} awaiting`}
          changeType="neutral"
          icon={Clock}
          gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <MetricCard
          title="Overdue Vouchers"
          value={`$${overdueAmount.toFixed(2)}`}
          change={`${overdueVouchers.length} overdue`}
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
                      {vouchers.length === 0
                        ? "No vouchers found in database"
                        : "No vouchers found in the selected period"}
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
                  data={[
                    { name: "Paid", value: paidVouchers.length, color: "#10b981" },
                    { name: "Pending", value: pendingVouchers.length, color: "#f59e0b" },
                    { name: "Overdue", value: overdueVouchers.length, color: "#ef4444" }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    { color: "#10b981" },
                    { color: "#f59e0b" },
                    { color: "#ef4444" }
                  ].map((entry, index) => (
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
              <CardTitle className="dark:text-white">Voucher Transactions</CardTitle>
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
                  placeholder="Search by client, voucher number..."
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
                    <SelectItem value="overdue">Overdue</SelectItem>
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
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Voucher #</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Client</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Payment Type</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Amount</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Status</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Due Date</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow className="dark:border-gray-700">
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No vouchers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayments.map((v) => (
                    <TableRow
                      key={v.id}
                      className={`dark:border-gray-700 ${v.status === "overdue"
                        ? "bg-red-50/50 dark:bg-red-900/10"
                        : ""
                        }`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(v.id)}
                          onCheckedChange={() => handleSelectRow(v.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium dark:text-gray-300 whitespace-nowrap">
                        {v.voucherNumber}
                      </TableCell>
                      <TableCell className="dark:text-gray-300 whitespace-nowrap">
                        {v.clientName || "N/A"}
                      </TableCell>
                      <TableCell className="dark:text-gray-300 whitespace-nowrap">
                        {v.paymentTypeName || "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold dark:text-gray-300 whitespace-nowrap">
                        ${parseFloat(v.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={v.status}
                          onValueChange={(newStatus) => handleStatusUpdate(v.id, newStatus)}
                          disabled={userRole !== 'accountant'}
                        >
                          <SelectTrigger className={`w-[140px] h-8 text-xs border ${statusColors[v.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="dark:text-gray-300 whitespace-nowrap text-sm">
                        {formatDate(v.due_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedVoucher(v); setIsDialogOpen(true); }}
                            className="dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => vouchersService.downloadPDF(v.id, v.voucherNumber)}
                            className="dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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

      {/* Voucher Details Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Voucher Details</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Complete information for Voucher {selectedVoucher?.voucherNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedVoucher && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Voucher Number</p>
                  <p className="text-sm font-semibold dark:text-gray-300">{selectedVoucher.voucherNumber}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <Badge
                    variant="outline"
                    className={`${statusColors[selectedVoucher.status]} flex items-center gap-1 w-fit`}
                  >
                    <span className="capitalize">{selectedVoucher.status}</span>
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">${parseFloat(selectedVoucher.amount).toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Date</p>
                  <p className="text-sm dark:text-gray-300">{formatDate(selectedVoucher.dueDate)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Client</p>
                  <p className="text-sm dark:text-gray-300">{selectedVoucher.clientName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Type</p>
                  <p className="text-sm dark:text-gray-300">{selectedVoucher.paymentTypeName}</p>
                </div>
              </div>

              {selectedVoucher.description && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold mb-2 dark:text-white">Description</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                    {selectedVoucher.description}
                  </p>
                </div>
              )}

              {selectedVoucher.attachment_url && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold mb-2 dark:text-white">Attachment</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedVoucher.attachment_url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Attachment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Voucher Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add New Voucher</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Create a new payment voucher for a client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Client *</label>
                <Select value={newVoucher.clientId} onValueChange={(value) => setNewVoucher({ ...newVoucher, clientId: value })}>
                  <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id.toString()}>{client.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium dark:text-gray-300">Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newVoucher.amount}
                  onChange={(e) => setNewVoucher({ ...newVoucher, amount: e.target.value })}
                  className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Payment Type *</label>
                <Select value={newVoucher.paymentTypeId} onValueChange={(value) => setNewVoucher({ ...newVoucher, paymentTypeId: value })}>
                  <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    {paymentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.type_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Due Date *</label>
                <Input
                  type="date"
                  value={newVoucher.dueDate}
                  onChange={(e) => setNewVoucher({ ...newVoucher, dueDate: e.target.value })}
                  className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium dark:text-gray-300">Description</label>
                <Input
                  placeholder="Enter voucher description"
                  value={newVoucher.description}
                  onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })}
                  className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Status</label>
                <Select value={newVoucher.status} onValueChange={(value) => setNewVoucher({ ...newVoucher, status: value })}>
                  <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300">Attachment</label>
                <Input
                  type="file"
                  onChange={(e) => setNewVoucher({ ...newVoucher, attachment: e.target.files[0] })}
                  className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewVoucher({
                  clientId: '',
                  paymentTypeId: '',
                  amount: '',
                  dueDate: new Date().toISOString().split('T')[0],
                  description: '',
                  status: 'pending',
                  attachment: null
                });
              }}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateVoucher}>
              Create Voucher
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


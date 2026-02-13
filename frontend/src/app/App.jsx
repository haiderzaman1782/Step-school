import React from "react";
import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopNavigation } from "./components/TopNavigation";
import { MetricCard } from "./components/MetricCard";
import { Login } from "./components/Login";
import { Settings } from "./components/Settings";
import { Payments } from "./components/Payments";
import { Users } from "./components/Users";
import { AdminPortal } from "./components/AdminPortal";
import { ThemeProvider } from "./providers/ThemeProvider";
import {
  DollarSign,
  TrendingUp,
  Users as UsersIcon,
  Calendar,
  CreditCard,
  CircleCheck,
  Clock,
  CircleX,
  Eye,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./components/ui/dialog";
import { paymentsService } from "./services/paymentsService";
import { usersService } from "./services/usersService";
import { calculateWeeklyRevenue, calculateMonthlyRevenue } from "./utils/chartDataUtils";
import { toast, Toaster } from "sonner";

// Helper function to normalize date to YYYY-MM-DD format
const normalizeDate = (dateValue) => {
  if (!dateValue) return null;
  if (typeof dateValue === 'string') {
    // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    const dateStr = dateValue.split('T')[0];
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
  }
  // Try to parse as Date object
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
};

function DashboardContent() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const statusIcons = {
    paid: CircleCheck,
    pending: Clock,
    failed: CircleX,
  };

  const statusColors = {
    paid: "text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800",
    pending: "text-yellow-600 bg-yellow-100 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800",
    failed: "text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800",
  };

  // Check for existing session
  useEffect(() => {
    const authData = sessionStorage.getItem("adminAuth");
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        if (parsedAuth.isAuthenticated) {
          setIsAuthenticated(true);
          setAdminUser(parsedAuth);
        }
      } catch (e) {
        sessionStorage.removeItem("adminAuth");
      }
    }
  }, []);

  // Fetch data only if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (authData) => {
    setIsAuthenticated(true);
    setAdminUser(authData);
    setActiveSection("dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setAdminUser(null);
    setActiveSection("dashboard");
    toast.success("Logged out successfully");
  };





  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch all records for charts (using a very high limit to get all data)
      // For tables, we can still paginate, but charts need all data
      const [paymentsRes, usersRes] = await Promise.all([
        paymentsService.getAll({ limit: 10000 }),
        usersService.getAll({ limit: 10000 }),
      ]);

      setPayments(paymentsRes.payments || []);
      setUsers(usersRes.users || []);
    } catch (error) {
      toast.error("Failed to load data. Using fallback data.");
      // Fallback to empty arrays if API fails
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };



  // Calculate metrics from database data
  const today = new Date().toISOString().split('T')[0];

  // Calculate chart data
  const weeklyData = calculateWeeklyRevenue(payments);
  const monthlyData = calculateMonthlyRevenue(payments);

  // Pending Payments - count and calculate total amount
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const pendingPaymentsAmount = payments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  // Total Revenue - sum of all paid payments
  const totalRevenue = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);



  // Handle payment created
  const handlePaymentCreated = async (newPayment) => {
    setPayments([...payments, newPayment]);
    await fetchAllData(); // Refresh all data
  };

  // Handle record created from Quick Add
  const handleQuickAddRecordCreated = async (type, record) => {
    await fetchAllData(); // Refresh all data to ensure consistency and relationship links
    setShowQuickAdd(false); // Close the modal after successful creation
  };









  // Handle payment status update
  const handlePaymentStatusUpdate = async (paymentId, newStatus) => {
    setPayments(prevPayments =>
      prevPayments.map(p =>
        p.id === paymentId ? { ...p, status: newStatus } : p
      )
    );
    // Refresh all data to ensure charts and metrics are updated
    await fetchAllData();
  };

  // Render payments section
  const renderPaymentsSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage all payment transactions, track revenue, and handle refunds.
          </p>
        </div>

        {/* Payments Component */}
        <Payments
          payments={payments}
          onPaymentCreated={handlePaymentCreated}
          onStatusUpdate={handlePaymentStatusUpdate}
        />
      </div>
    );
  };

  // Render users section
  const renderUsersSection = () => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage all users, roles, permissions, and account activity.
          </p>
        </div>

        {/* Users Component */}
        <Users
          users={users}
          payments={payments}
        />
      </div>
    );
  };

  // Render settings section
  const renderSettingsSection = () => {
    return <Settings />;
  };




  // Render dashboard section
  const renderDashboardSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's an overview of your system's performance.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Total Users"
            value={users.length}
            change={`${users.filter(u => u.status === 'active').length} active`}
            changeType="positive"
            icon={UsersIcon}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <MetricCard
            title="Payments"
            value={payments.length}
            change="All transactions"
            changeType="neutral"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          />
          <MetricCard
            title="Pending Payments"
            value={`$${pendingPaymentsAmount.toFixed(2)}`}
            change={`${pendingPayments} transactions`}
            changeType="neutral"
            icon={DollarSign}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <MetricCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            change="All-time paid"
            changeType="positive"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
        </div>

        {/* Recent Payments Table */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none mt-6">
          <CardHeader className="flex flex-row items-center justify-between pb-4 px-4 sm:px-6">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Recent Payments</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 gap-1"
              onClick={() => setActiveSection("payments")}
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b dark:border-gray-700">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3 pl-6">Transaction ID</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-3 pr-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 5).map((payment) => {
                    const StatusIcon = statusIcons[payment.status] || Clock;
                    return (
                      <TableRow key={payment.id} className="border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell className="py-4 pl-6 font-medium text-gray-900 dark:text-white">
                          {payment.transactionId || payment.id}
                        </TableCell>
                        <TableCell className="py-4 font-medium text-gray-700 dark:text-gray-300">
                          {payment.customerName}
                        </TableCell>
                        <TableCell className="py-4 font-bold text-gray-900 dark:text-white">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4">
                          <Select
                            value={payment.status}
                            onValueChange={(newStatus) => handlePaymentStatusUpdate(payment.id, newStatus)}
                          >
                            <SelectTrigger className={`w-[120px] h-8 text-xs border-2 ${statusColors[payment.status] || statusColors.pending}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-4 text-gray-600 dark:text-gray-400 pr-6">
                          {payment.date || 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        No recent payments found
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

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onQuickAdd={() => setShowQuickAdd(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavigation
          onLogout={handleLogout}
          adminUser={adminUser}
          onQuickAdd={() => setShowQuickAdd(true)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {activeSection === "payments"
              ? renderPaymentsSection()
              : activeSection === "users"
                ? renderUsersSection()
                : activeSection === "settings"
                  ? renderSettingsSection()
                  : renderDashboardSection()
            }
          </div>
        </main>
      </div>

      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-gray-950 border-none sm:rounded-2xl shadow-2xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-bold">Quick Create</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Fill in the form below to create a new user or payment record.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <AdminPortal
              users={users}
              onRecordCreated={handleQuickAddRecordCreated}
            />
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t dark:border-gray-700">
            <Button variant="outline" onClick={() => setShowQuickAdd(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
      <Toaster richColors closeButton />
    </ThemeProvider>
  );
}


import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { ExportDropdown } from "./ExportDropdown.jsx";
import { ExportConfigModal } from "./ExportConfigModal.jsx";
import { exportToCSV, exportToPDF, formatDateForExport, formatDateTimeForExport } from "../utils/exportUtils.js";
import {
  Users as UsersIcon,
  UserCheck,
  UserPlus,
  UserX,
  Search,
  Eye,
  Edit,
  Ban,
  Trash2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Upload,
  DollarSign,
  Activity,
  X,
  Phone
} from "lucide-react";
import { MetricCard } from "./MetricCard.jsx";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { usersService } from "../services/usersService";
import { vouchersService } from "../services/vouchersService";
import { AlertTriangle } from "lucide-react";

const roleColors = {
  accountant: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  client: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
};

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  inactive: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  blocked: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const roleIcons = {
  accountant: Shield,
  client: UserCheck,
};

export function Users() {
  const [usersData, setUsersData] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exportScope, setExportScope] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'client',
    status: 'active',
    avatar: null,
    avatarPreview: null,
  });
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uData, vData] = await Promise.all([
        usersService.getAll(),
        vouchersService.getAll()
      ]);
      setUsersData(uData.users || []);
      setVouchers(vData);
    } catch (error) {
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Update suspicious users logic (e.g., users with overdue vouchers)
  const suspiciousUsers = usersData.filter(u => {
    const userVouchers = vouchers.filter(v => v.client_id === u.id);
    return userVouchers.some(v => v.status === "overdue");
  });

  // Filter and sort users
  let filteredUsers = usersData.filter(user => {
    const matchesSearch =
      (user.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.phone || '').includes(searchQuery);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  filteredUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "mostActive":
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      default:
        return 0;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, sortBy]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);



  const getUserVouchers = (userId) => {
    return vouchers?.filter(v =>
      v.client_id === userId || v.id === userId
    ) || [];
  };



  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditAvatarPreview(user.avatar || null);
    setIsEditDialogOpen(true);
  };

  // Helper function to extract numeric ID from transformed ID string
  const getNumericId = (id) => {
    if (typeof id === 'number') return id;
    if (typeof id === 'string') {
      // Handle "USR001" format
      if (id.startsWith('USR')) {
        const numPart = id.replace('USR', '');
        return parseInt(numPart) || id;
      }
      // Handle plain numeric string like "1"
      const parsed = parseInt(id);
      if (!isNaN(parsed)) return parsed;
    }
    return id; // Fallback to original if can't parse
  };

  const handleBlockUser = async (user) => {
    try {
      const newStatus = user.status === "blocked" ? "active" : "blocked";
      const userId = getNumericId(user.id);
      await usersService.update(userId, {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: newStatus,
        avatar: user.avatar,
      });
      setUsersData(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id
            ? { ...u, status: newStatus }
            : u
        )
      );
      toast.success(
        user.status === "blocked"
          ? "User has been unblocked"
          : "User has been blocked",
        {
          description: `${user.fullName} status updated`,
          duration: 3000,
        }
      );
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        const userId = getNumericId(userToDelete.id);
        await usersService.delete(userId);
        setUsersData(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        toast.success("User deleted", {
          description: `${userToDelete.fullName} has been removed from the system`,
          duration: 3000,
        });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle row selection
  const handleSelectRow = (userId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (paginatedUsers.every(u => selectedRows.has(u.id))) {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        paginatedUsers.forEach(u => newSet.delete(u.id));
        return newSet;
      });
    } else {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        paginatedUsers.forEach(u => newSet.add(u.id));
        return newSet;
      });
    }
  };

  // Get data to export based on scope
  const getExportData = () => {
    let dataToExport = [];
    if (exportScope === "selected") {
      dataToExport = filteredUsers.filter(u => selectedRows.has(u.id));
    } else if (exportScope === "filtered") {
      dataToExport = filteredUsers;
    } else {
      dataToExport = users; // All users including customers
    }
    return dataToExport;
  };

  // Export columns configuration
  const exportColumns = [
    // { key: "id", label: "User ID" },
    { key: "fullName", label: "Full Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    // { key: "totalpayments", label: "Total Payments" },
    // { key: "totalcalls", label: "Total Calls" },
    // { key: "createdAt", label: "Created Date" },
    // { key: "lastActivity", label: "Last Activity" },
  ];

  // Compress image before converting to base64
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Avatar file is too large. Maximum size is 5MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }

      // Create preview URL from file
      const previewUrl = URL.createObjectURL(file);
      setNewUser({
        ...newUser,
        avatar: file, // Store File object
        avatarPreview: previewUrl,
      });
      toast.success("Avatar selected successfully");
    }
  };

  // Handle edit avatar upload
  const handleEditAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Avatar file is too large. Maximum size is 5MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }

      // Create preview URL from file
      const previewUrl = URL.createObjectURL(file);
      setEditAvatarPreview(previewUrl);
      setEditAvatarFile(file); // Store File object for upload
      toast.success("Avatar selected successfully");
    }
  };

  // Handle create user
  const handleCreateUser = async () => {
    if (!newUser.fullName || !newUser.email) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      // Log avatar for debugging

      const createdUser = await usersService.create({
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        avatar: newUser.avatar || null, // Send null instead of undefined
      });
      setUsersData([...usersData, createdUser]);
      setIsCreateDialogOpen(false);
      // Clean up preview URL
      if (newUser.avatarPreview && newUser.avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(newUser.avatarPreview);
      }
      setNewUser({
        fullName: '',
        email: '',
        phone: '',
        role: 'customer',
        status: 'active',
        avatar: null,
        avatarPreview: null,
      });
      toast.success("User created successfully");
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  // Handle export
  const handleExport = async (format) => {
    setSelectedFormat(format);
    // Allow user to choose scope in modal, but default based on current state
    const defaultScope = selectedRows.size > 0 ? "selected" :
      (searchQuery || roleFilter !== "all" || statusFilter !== "all") ? "filtered" : "all";
    setExportScope(defaultScope);
    setShowExportModal(true);
  };

  const handleExportConfirm = async (config) => {
    setIsExporting(true);
    try {
      // Use scope from config if provided, otherwise use current exportScope
      const scopeToUse = config.exportScope || exportScope;
      let dataToExport = [];
      if (scopeToUse === "selected") {
        dataToExport = filteredUsers.filter(u => selectedRows.has(u.id));
      } else if (scopeToUse === "filtered") {
        dataToExport = filteredUsers;
      } else {
        dataToExport = users; // All records including all users
      }

      // Filter by date range if provided
      let filteredData = dataToExport;
      if (config.startDate || config.endDate) {
        filteredData = dataToExport.filter(user => {
          const userDate = new Date(user.createdAt);
          if (config.startDate && userDate < new Date(config.startDate)) return false;
          if (config.endDate && userDate > new Date(config.endDate)) return false;
          return true;
        });
      }

      // Filter columns
      const selectedColumns = exportColumns.filter(col => config.columns.includes(col.key));

      // Prepare data with formatted values
      const formattedData = filteredData.map(user => {
        const row = {};
        selectedColumns.forEach(col => {
          switch (col.key) {
            case "createdAt":
              row[col.key] = user.createdAt ? formatDateForExport(user.createdAt) : "N/A";
              break;
            case "lastActivity":
              row[col.key] = user.lastActivity ? formatTimestamp(user.lastActivity) : "N/A";
              break;
            case "role":
            case "status":
              row[col.key] = user[col.key].charAt(0).toUpperCase() + user[col.key].slice(1);
              break;
            default:
              row[col.key] = user[col.key] || "N/A";
          }
        });
        return row;
      });

      if (config.format === "csv") {
        exportToCSV(formattedData, selectedColumns, "users");
        toast.success("Users exported successfully!", {
          description: `${formattedData.length} records exported as CSV`,
        });
      } else if (config.format === "pdf") {
        const summaryData = config.includeSummary ? {
          "Total Users": formattedData.length,
          "Admins": formattedData.filter(d => d.role === "Admin").length,
          "Staff": formattedData.filter(d => d.role === "Staff").length,
          "Agents": formattedData.filter(d => d.role === "Agent").length,
          "Active": formattedData.filter(d => d.status === "Active").length,
          "Inactive": formattedData.filter(d => d.status === "Inactive").length,
          "Blocked": formattedData.filter(d => d.status === "Blocked").length,
        } : null;

        await exportToPDF(
          formattedData,
          selectedColumns,
          {
            filename: "users",
            title: "Users Report",
            orientation: config.orientation,
            includeSummary: config.includeSummary,
            summaryData,
          }
        );
        toast.success("Users exported successfully!", {
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

  // Calculate metrics
  const totalUsers = usersData.length;
  const activeUsers = usersData.filter(user => user.status === 'active').length;
  const newUsersToday = usersData.filter(user => {
    const today = new Date().toISOString().split('T')[0];
    return user.createdAt?.split('T')[0] === today;
  }).length;
  const newUsersThisWeek = usersData.filter(user => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(user.createdAt) >= weekAgo;
  }).length;
  const blockedUsers = usersData.filter(user => user.status === 'blocked').length;

  const roleDistributionData = [
    { name: "Accountant", value: usersData.filter(u => u.role === "accountant").length, color: "#3b82f6" },
    { name: "Client", value: usersData.filter(u => u.role === "client").length, color: "#6b7280" }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overdue Clients Alert Banner */}
      {suspiciousUsers.length > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 dark:text-red-300">
                  {suspiciousUsers.length} Client{suspiciousUsers.length > 1 ? 's' : ''} with Overdue Vouchers
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Clients with unpaid overdue vouchers require attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          change={`${activeUsers} active`}
          changeType="positive"
          icon={UsersIcon}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Active Users"
          value={activeUsers}
          change={`${((activeUsers / (totalUsers || 1)) * 100).toFixed(0)}% of total`}
          changeType="positive"
          icon={UserCheck}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="New Users"
          value={newUsersThisWeek}
          change={`${newUsersToday} today`}
          changeType="positive"
          icon={UserPlus}
          gradient="bg-gradient-to-br from-teal-500 to-teal-600"
        />
        <MetricCard
          title="Blocked/Inactive"
          value={blockedUsers}
          change="Requires attention"
          changeType="negative"
          icon={UserX}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* User Growth Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
            <CardHeader>
              <CardTitle className="dark:text-white">User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { name: "Jan", users: 120 },
                  { name: "Feb", users: 135 },
                  { name: "Mar", users: 148 },
                  { name: "Apr", users: 162 },
                  { name: "May", users: 175 },
                  { name: "Jun", users: 188 },
                  { name: "Jul", users: 195 },
                  { name: "Aug", users: 210 },
                  { name: "Sep", users: 225 },
                  { name: "Oct", users: 238 },
                  { name: "Nov", users: 250 },
                  { name: "Dec", users: 265 }
                ]}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                    name="Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
          <CardHeader>
            <CardTitle className="dark:text-white">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {roleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>



      {/* Users Table */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">Users Management</CardTitle>
              <div className="flex items-center gap-2">
                <ExportDropdown
                  onExport={handleExport}
                  disabled={filteredUsers.length === 0}
                  isLoading={isExporting}
                  exportScope={exportScope}
                  hasSelectedRows={selectedRows.size > 0}
                  hasFilters={searchQuery || roleFilter !== "all" || statusFilter !== "all"}
                />
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="mostActive">Most Active</SelectItem>
                      <SelectItem value="mostPayments">Most Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="text-center">
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedRows.has(u.id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">User ID</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Avatar</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Full Name</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Email</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Phone</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Role</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Status</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Last Activity</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow className="dark:border-gray-700">
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => {
                    const RoleIcon = roleIcons[user.role] || UsersIcon;
                    const isSuspicious = user.failedPayments >= 2;

                    return (
                      <TableRow
                        key={user.id}
                        className={`dark:border-gray-700  ${user.status === "blocked" || isSuspicious
                          ? "bg-red-50/50 dark:bg-red-900/10"
                          : ""
                          }`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(user.id)}
                            onCheckedChange={() => handleSelectRow(user.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium dark:text-gray-300 whitespace-nowrap">
                          {user.id}
                        </TableCell>
                        <TableCell>
                          <Avatar className="w-8 h-8 mx-auto">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="dark:text-gray-300 whitespace-nowrap">
                          {user.fullName}
                        </TableCell>
                        <TableCell className="dark:text-gray-300 whitespace-nowrap">
                          {user.email}
                        </TableCell>
                        <TableCell className="dark:text-gray-300 whitespace-nowrap">
                          {user.phone}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${roleColors[user.role]} flex items-center gap-1 w-fit`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            <span className="capitalize">{user.role}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${statusColors[user.status]} flex items-center gap-1 w-fit`}
                          >
                            <span className="capitalize">{user.status}</span>
                          </Badge>
                        </TableCell>

                        <TableCell className="dark:text-gray-300 whitespace-nowrap text-sm">
                          {formatTimestamp(user.lastActivity)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlockUser(user)}
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              className="dark:text-red-300 dark:hover:bg-red-900/20 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
          {filteredUsers.length > 0 && (
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} entries
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

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white">User Profile</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Complete information for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* User Basic Information */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.fullName} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold dark:text-white">{selectedUser.fullName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={roleColors[selectedUser.role]}>
                      <span className="capitalize">{selectedUser.role}</span>
                    </Badge>
                    <Badge variant="outline" className={statusColors[selectedUser.status]}>
                      <span className="capitalize">{selectedUser.status}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</p>
                  <p className="text-sm font-semibold dark:text-gray-300">{selectedUser.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</p>
                  <p className="text-sm dark:text-gray-300">{selectedUser.phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="text-sm dark:text-gray-300">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Activity</p>
                  <p className="text-sm dark:text-gray-300">{formatTimestamp(selectedUser.lastActivity)}</p>
                </div>

                {(selectedUser.failedCalls > 0 || selectedUser.failedPayments > 0) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Failed Activities</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {selectedUser.failedCalls} failed calls, {selectedUser.failedPayments} failed payments
                    </p>
                  </div>
                )}
              </div>



              {/* Voucher History */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Voucher History
                </h4>
                {(() => {
                  const userVouchers = getUserVouchers(selectedUser.id);
                  return userVouchers.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userVouchers.slice(0, 5).map((v) => (
                        <div key={v.id} className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm dark:text-gray-300">${parseFloat(v.amount).toFixed(2)}</span>
                            <Badge variant="outline" className={`text-xs ${statusColors[v.status]}`}>
                              {v.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(v.due_date).toLocaleDateString()} • {v.payment_type_name}
                          </p>
                        </div>
                      ))}
                      {userVouchers.length > 5 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{userVouchers.length - 5} more vouchers
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No voucher history found</p>
                  );
                })()}
              </div>

              {/* Account Activity */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Account Activity
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm dark:text-gray-300">Account created</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(selectedUser.createdAt)}</p>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm dark:text-gray-300">Last login</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(selectedUser.lastActivity)}</p>
                  </div>
                  {selectedUser.failedCalls > 0 && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">Failed calls: {selectedUser.failedCalls}</p>
                    </div>
                  )}
                  {selectedUser.overdueVouchers > 0 && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">Overdue vouchers: {selectedUser.overdueVouchers}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit User</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Update information for {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 mt-4">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center mb-4">
                <label className="text-sm font-medium dark:text-gray-300 mb-2">Profile Picture</label>
                <div className="relative">
                  {editAvatarPreview ? (
                    <div className="relative">
                      <img
                        src={editAvatarPreview}
                        alt="Avatar preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editAvatarPreview && editAvatarPreview.startsWith('blob:')) {
                            URL.revokeObjectURL(editAvatarPreview);
                          }
                          setEditAvatarPreview(null);
                          setEditAvatarFile(null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={selectedUser.avatar} alt={selectedUser.fullName} />
                        <AvatarFallback>{selectedUser.fullName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {editAvatarPreview ? 'Change Avatar' : 'Upload Avatar'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Max 2MB, JPG/PNG
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Full Name</label>
                  <Input
                    data-edit-field="fullName"
                    defaultValue={selectedUser.fullName}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Email</label>
                  <Input
                    data-edit-field="email"
                    type="email"
                    defaultValue={selectedUser.email}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Phone</label>
                  <Input
                    data-edit-field="phone"
                    defaultValue={selectedUser.phone}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Role</label>
                  <Select defaultValue={selectedUser.role} onValueChange={(value) => {
                    const select = document.querySelector('[data-edit-field="role"]');
                    if (select) select.value = value;
                  }}>
                    <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" data-edit-field="role" defaultValue={selectedUser.role} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Status</label>
                  <Select defaultValue={selectedUser.status} onValueChange={(value) => {
                    const select = document.querySelector('[data-edit-field="status"]');
                    if (select) select.value = value;
                  }}>
                    <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" data-edit-field="status" defaultValue={selectedUser.status} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  // Get form values
                  const fullNameInput = document.querySelector('[data-edit-field="fullName"]');
                  const emailInput = document.querySelector('[data-edit-field="email"]');
                  const phoneInput = document.querySelector('[data-edit-field="phone"]');
                  const roleInput = document.querySelector('[data-edit-field="role"]');
                  const statusInput = document.querySelector('[data-edit-field="status"]');

                  const formData = {
                    fullName: fullNameInput?.value || selectedUser.fullName,
                    email: emailInput?.value || selectedUser.email,
                    phone: phoneInput?.value || selectedUser.phone,
                    role: roleInput?.value || selectedUser.role,
                    status: statusInput?.value || selectedUser.status,
                    avatar: editAvatarFile, // Send File object if new avatar was selected
                  };

                  const userId = getNumericId(selectedUser.id);
                  const updatedUser = await usersService.update(userId, formData);
                  // Update local state
                  setUsersData(prevUsers =>
                    prevUsers.map(u =>
                      u.id === selectedUser.id ? updatedUser : u
                    )
                  );
                  toast.success("User updated", {
                    description: `${selectedUser?.fullName} information has been updated`,
                    duration: 3000,
                  });
                  setIsEditDialogOpen(false);
                  // Clean up preview URL
                  if (editAvatarPreview && editAvatarPreview.startsWith('blob:')) {
                    URL.revokeObjectURL(editAvatarPreview);
                  }
                  setEditAvatarPreview(null);
                  setEditAvatarFile(null);
                } catch (error) {
                  toast.error("Failed to update user");
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 w-96 mx-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white text-red-600">Delete User</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure you want to delete {userToDelete?.fullName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will permanently remove the user from the system and all associated data.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add New User</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Create a new user account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center mb-4">
              <label className="text-sm font-medium dark:text-gray-300 mb-2">Profile Picture</label>
              <div className="relative">
                {newUser.avatarPreview ? (
                  <div className="relative">
                    <img
                      src={newUser.avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newUser.avatarPreview && newUser.avatarPreview.startsWith('blob:')) {
                          URL.revokeObjectURL(newUser.avatarPreview);
                        }
                        setNewUser({ ...newUser, avatar: null, avatarPreview: null });
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                    <UserPlus className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  {newUser.avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Max 2MB, JPG/PNG
              </p>
            </div>

            <div>
              <label className="text-sm font-medium dark:text-gray-300">Full Name *</label>
              <Input
                placeholder="Enter full name"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Email *</label>
              <Input
                type="email"
                placeholder="Enter email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Phone</label>
              <Input
                placeholder="Enter phone number"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Role</label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Status</label>
              <Select value={newUser.status} onValueChange={(value) => setNewUser({ ...newUser, status: value })}>
                <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewUser({
                  fullName: '',
                  email: '',
                  phone: '',
                  role: 'customer',
                  status: 'active',
                  avatar: null,
                  avatarPreview: null,
                });
              }}
              className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
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
        hasFilters={searchQuery || roleFilter !== "all" || statusFilter !== "all"}
      />
    </div >
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.jsx";
import { Phone, Search, ListFilter, CheckSquare, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { ExportDropdown } from "./ExportDropdown.jsx";
import { ExportConfigModal } from "./ExportConfigModal.jsx";
import { exportToCSV, exportToPDF } from "../utils/exportUtils.js";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog.jsx";
import { Plus, Calendar, Clock } from "lucide-react";
import { appointmentsService } from "../services/appointmentsService";

const statusColors = {
  confirmed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  completed: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

export function AppointmentsTable({ appointments, onStatusUpdate, onAppointmentCreated }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exportScope, setExportScope] = useState("all"); // "all", "filtered", "selected"
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    phone: '',
    email: '',
    service: '',
    date: '',
    time: '',
    assignedAgent: '',
    status: 'pending',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Helper function to normalize date to YYYY-MM-DD format
  const normalizeDate = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string') {
      const dateStr = dateValue.split('T')[0];
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
    }
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

  // Helper function to get date strings for filtering
  const getDateStrings = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      today: today.toISOString().split('T')[0],
      yesterday: yesterday.toISOString().split('T')[0],
      tomorrow: tomorrow.toISOString().split('T')[0],
    };
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    
    // Date filtering logic
    const matchesDate = (() => {
      if (dateFilter === "all") return true;
      
      const aptDate = normalizeDate(apt.date);
      if (!aptDate) return false;
      
      const dates = getDateStrings();
      
      switch (dateFilter) {
        case "today":
          return aptDate === dates.today;
        case "yesterday":
          return aptDate === dates.yesterday;
        case "tomorrow":
          return aptDate === dates.tomorrow;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAppointments.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const handleStatusChange = (appointmentId, newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(appointmentId, newStatus);
    }
  };

  // Handle row selection
  const handleSelectRow = (appointmentId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (paginatedAppointments.every(apt => selectedRows.has(apt.id))) {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        paginatedAppointments.forEach(apt => newSet.delete(apt.id));
        return newSet;
      });
    } else {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        paginatedAppointments.forEach(apt => newSet.add(apt.id));
        return newSet;
      });
    }
  };

  // Get data to export based on scope
  const getExportData = () => {
    let dataToExport = [];
    if (exportScope === "selected") {
      dataToExport = filteredAppointments.filter(apt => selectedRows.has(apt.id));
    } else if (exportScope === "filtered") {
      dataToExport = filteredAppointments;
    } else {
      dataToExport = appointments;
    }
    return dataToExport;
  };

  // Export columns configuration
  const exportColumns = [
    { key: "patientName", label: "Customer Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "service", label: "Service Name" },
    // { key: "status", label: "Status" },
    { key: "paymentStatus", label: "Payment Status" },
  ];

  // Handle export
  const handleExport = async (format) => {
    setSelectedFormat(format);
    // Allow user to choose scope in modal, but default based on current state
    const defaultScope = selectedRows.size > 0 ? "selected" : 
      (searchQuery || statusFilter !== "all" || dateFilter !== "all") ? "filtered" : "all";
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
        dataToExport = filteredAppointments.filter(apt => selectedRows.has(apt.id));
      } else if (scopeToUse === "filtered") {
        dataToExport = filteredAppointments;
      } else {
        dataToExport = appointments; // All records
      }
      
      // Filter by date range if provided
      let filteredData = dataToExport;
      if (config.startDate || config.endDate) {
        filteredData = dataToExport.filter(apt => {
          const aptDate = new Date(apt.date);
          if (config.startDate && aptDate < new Date(config.startDate)) return false;
          if (config.endDate && aptDate > new Date(config.endDate)) return false;
          return true;
        });
      }

      // Filter columns
      const selectedColumns = exportColumns.filter(col => config.columns.includes(col.key));
      
      // Prepare data with formatted values matching PDF format
      const formattedData = filteredData.map(apt => {
        const row = {};
        // Ensure all required fields are initialized
        selectedColumns.forEach(col => {
          switch (col.key) {
            case "patientName":
              // Ensure customer name is always present
              const customerName = apt.patientName || apt.user?.name || "Unknown";
              row[col.key] = customerName && customerName.trim() !== "" ? customerName : "Unknown";
              break;
            case "phone":
              row[col.key] = apt.phone || "N/A";
              break;
            case "email":
              row[col.key] = apt.email || "N/A";
              break;
            case "service":
              row[col.key] = apt.service || "N/A";
              break;
            // case "status":
            //   // Format appointment status with proper capitalization from table
            //   const status = apt.status || "pending";
            //   if (!status || status === "N/A") {
            //     row[col.key] = "Pending";
            //   } else {
            //     // Capitalize first letter and keep rest lowercase
            //     const formattedStatus = paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).toLowerCase();
            //     row[col.key] = formattedStatus;
            //   }
            //   break;
            case "paymentStatus":
              // Always set payment status to "Pending" for all appointments
              row[col.key] = apt.status;
              break;
            default:
              row[col.key] = apt[col.key] || "N/A";
          }
        });
        // Ensure patientName and paymentStatus are always present in the row if their columns are selected
        if (selectedColumns.some(col => col.key === "patientName") && !row.patientName) {
          const customerName = apt.patientName || apt.user?.name || "Unknown";
          row.patientName = customerName && customerName.trim() !== "" ? customerName : "Unknown";
        }
        if (selectedColumns.some(col => col.key === "paymentStatus") && !row.paymentStatus) {
          // Show actual payment status from the data
          const paymentStatus = apt.paymentStatus || apt.paymentstatus || "Pending";
          const formattedStatus = paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).toLowerCase();
          row.paymentStatus = formattedStatus;
        }
        return row;
      });

      if (config.format === "csv") {
        exportToCSV(formattedData, selectedColumns, "appointments");
        toast.success("Appointments exported successfully!", {
          description: `${formattedData.length} records exported as CSV`,
        });
      } else if (config.format === "pdf") {
        const summaryData = config.includeSummary ? {
          "Total Appointments": formattedData.length,
        } : null;

        exportToPDF(
          formattedData,
          selectedColumns,
          {
            filename: "appointments",
            title: "Appointments Report",
            orientation: config.orientation,
            includeSummary: config.includeSummary,
            summaryData,
          }
        );
        toast.success("Appointments exported successfully!", {
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

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="dark:text-white">Recent Appointments</CardTitle>
            <div className="flex items-center gap-2">
              <ExportDropdown
                onExport={handleExport}
                disabled={filteredAppointments.length === 0}
                isLoading={isExporting}
                exportScope={exportScope}
                hasSelectedRows={selectedRows.size > 0}
                hasFilters={searchQuery || statusFilter !== "all" || dateFilter !== "all"}
              />
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by patient name, service, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
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
                      checked={paginatedAppointments.length > 0 && paginatedAppointments.every(apt => selectedRows.has(apt.id))}
                      onCheckedChange={handleSelectAll}
                    />
                </TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">ID</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Patient Name</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Date</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Time</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Service</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Status</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Payment Status</TableHead>
                <TableHead className="dark:text-gray-300 whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow className="dark:border-gray-700">
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAppointments.map((appointment) => (
                  <TableRow key={appointment.id} className="dark:border-gray-700">
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(appointment.id)}
                        onCheckedChange={() => handleSelectRow(appointment.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium dark:text-gray-300 whitespace-nowrap">{appointment.id}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{appointment.patientName}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{new Date(appointment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{appointment.time}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{appointment.service}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">{appointment.status}</TableCell>
                    <TableCell className="dark:text-gray-300 whitespace-nowrap">
                      {appointment.paymentStatus ? 
                        appointment.paymentStatus.charAt(0).toUpperCase() + appointment.paymentStatus.slice(1).toLowerCase() 
                        : "Pending"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={appointment.status}
                        onValueChange={(newStatus) => handleStatusChange(appointment.id, newStatus)}
                      >
                        <SelectTrigger className={`w-[140px] h-8 text-xs border ${statusColors[appointment.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {filteredAppointments.length > 0 && (
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of {filteredAppointments.length} entries
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
                      className={`w-8 h-8 p-0 ${
                        currentPage === pageNum 
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
    </Card>
  );
}


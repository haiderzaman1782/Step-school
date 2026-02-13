import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.jsx";
import { Badge } from "./ui/badge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.jsx";
import { PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Search, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { ExportDropdown } from "./ExportDropdown.jsx";
import { ExportConfigModal } from "./ExportConfigModal.jsx";
import { exportToCSV, exportToPDF, formatDateForExport, formatDateTimeForExport } from "../utils/exportUtils.js";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MetricCard } from "./MetricCard.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog.jsx";
import { Plus } from "lucide-react";
import { callsService } from "../services/callsService";

const statusColors = {
  completed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  missed: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  bounced: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  failed: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  active: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
};

const callTypeIcons = {
  incoming: PhoneIncoming,
  outgoing: PhoneOutgoing,
};

const statusIcons = {
  completed: PhoneCall,
  missed: PhoneMissed,
  bounced: PhoneOff,
  failed: PhoneMissed,
  active: PhoneCall,
};

export function CallsLog({ callLogs, liveCalls, onCallCreated }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [callTypeFilter, setCallTypeFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exportScope, setExportScope] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCall, setNewCall] = useState({
    callerName: '',
    phoneNumber: '',
    callType: 'incoming',
    status: 'completed',
    duration: '00:00',
    timestamp: new Date().toISOString().slice(0, 16),
    purpose: '',
    notes: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calculate metrics
  const missedCalls = callLogs.filter(call => call.status === "missed").length;
  const bouncedCalls = callLogs.filter(call => call.status === "bounced").length;
  const failedCalls = callLogs.filter(call => call.status === "failed").length;
  const totalCalls = callLogs.length;
  const completedCalls = callLogs.filter(call => call.status === "completed").length;

  // Filter call logs
  const filteredCallLogs = callLogs.filter(call => {
    const matchesSearch = 
      call.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.phoneNumber.includes(searchQuery) ||
      call.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || call.status === statusFilter;
    const matchesCallType = callTypeFilter === "all" || call.callType === callTypeFilter;
    
    return matchesSearch && matchesStatus && matchesCallType;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCallLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCallLogs = filteredCallLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, callTypeFilter]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Handle row selection
  const handleSelectRow = (callId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(callId)) {
        newSet.delete(callId);
      } else {
        newSet.add(callId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedCallLogs.length && paginatedCallLogs.every(call => selectedRows.has(call.id))) {
      // Deselect all paginated items
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        paginatedCallLogs.forEach(call => newSet.delete(call.id));
        return newSet;
      });
    } else {
      // Select all paginated items
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        paginatedCallLogs.forEach(call => newSet.add(call.id));
        return newSet;
      });
    }
  };

  // Get data to export based on scope
  const getExportData = () => {
    let dataToExport = [];
    if (exportScope === "selected") {
      dataToExport = filteredCallLogs.filter(call => selectedRows.has(call.id));
    } else if (exportScope === "filtered") {
      dataToExport = filteredCallLogs;
    } else {
      dataToExport = callLogs;
    }
    return dataToExport;
  };

  // Export columns configuration
  const exportColumns = [
    // { key: "id", label: "Call ID" },
    { key: "callerName", label: "Caller Name" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "callType", label: "Call Type" },
    { key: "status", label: "Status" },
    // { key: "duration", label: "Duration" },
    // { key: "timestamp", label: "Date & Time" },
    { key: "purpose", label: "Purpose" },
    // { key: "notes", label: "Notes" },
  ];

  // Handle export
  const handleExport = async (format) => {
    setSelectedFormat(format);
    // Allow user to choose scope in modal, but default based on current state
    const defaultScope = selectedRows.size > 0 ? "selected" : 
      (searchQuery || statusFilter !== "all" || callTypeFilter !== "all") ? "filtered" : "all";
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
        dataToExport = filteredCallLogs.filter(call => selectedRows.has(call.id));
      } else if (scopeToUse === "filtered") {
        dataToExport = filteredCallLogs;
      } else {
        dataToExport = callLogs; // All records
      }
      
      // Filter by date range if provided
      let filteredData = dataToExport;
      if (config.startDate || config.endDate) {
        filteredData = dataToExport.filter(call => {
          const callDate = new Date(call.timestamp);
          if (config.startDate && callDate < new Date(config.startDate)) return false;
          if (config.endDate && callDate > new Date(config.endDate)) return false;
          return true;
        });
      }

      // Filter columns
      const selectedColumns = exportColumns.filter(col => config.columns.includes(col.key));
      
      // Prepare data with formatted values
      const formattedData = filteredData.map(call => {
        const row = {};
        selectedColumns.forEach(col => {
          switch (col.key) {
            case "timestamp":
              row[col.key] = formatDateTimeForExport(call.timestamp);
              break;
            case "callType":
            case "status":
              row[col.key] = call[col.key].charAt(0).toUpperCase() + call[col.key].slice(1);
              break;
            default:
              row[col.key] = call[col.key] || "N/A";
          }
        });
        return row;
      });

      if (config.format === "csv") {
        exportToCSV(formattedData, selectedColumns, "call-logs");
        toast.success("Call logs exported successfully!", {
          description: `${formattedData.length} records exported as CSV`,
        });
      } else if (config.format === "pdf") {
        const summaryData = config.includeSummary ? {
          "Total Calls": formattedData.length,
          "Completed": formattedData.filter(d => d.status === "Completed").length,
          "Missed": formattedData.filter(d => d.status === "Missed").length,
          "Bounced": formattedData.filter(d => d.status === "Bounced").length,
          "Incoming": formattedData.filter(d => d.callType === "Incoming").length,
          "Outgoing": formattedData.filter(d => d.callType === "Outgoing").length,
        } : null;

        await exportToPDF(
          formattedData,
          selectedColumns,
          {
            filename: "call-logs",
            title: "Call Logs Report",
            orientation: config.orientation,
            includeSummary: config.includeSummary,
            summaryData,
          }
        );
        toast.success("Call logs exported successfully!", {
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

  // Handle create call
  const handleCreateCall = async () => {
    if (!newCall.callerName || !newCall.phoneNumber) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      const created = await callsService.create({
        callerName: newCall.callerName,
        phoneNumber: newCall.phoneNumber,
        callType: newCall.callType,
        status: newCall.status,
        duration: newCall.duration,
        timestamp: newCall.timestamp,
        purpose: newCall.purpose,
        notes: newCall.notes,
      });
      if (onCallCreated) {
        onCallCreated(created);
      }
      setIsCreateDialogOpen(false);
      setNewCall({ callerName: '', phoneNumber: '', callType: 'incoming', status: 'completed', duration: '00:00', timestamp: new Date().toISOString().slice(0, 16), purpose: '', notes: '' });
      toast.success("Call log created successfully");
    } catch (error) {
      toast.error("Failed to create call log");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Missed and Bounced Calls Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Missed Calls"
          value={missedCalls}
          change="Requires attention"
          changeType="negative"
          icon={PhoneMissed}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
        <MetricCard
          title="Bounced Calls"
          value={bouncedCalls}
          change="Quick disconnects"
          changeType="negative"
          icon={PhoneOff}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <MetricCard
          title="Total Calls"
          value={totalCalls}
          change={`${completedCalls} completed`}
          changeType="neutral"
          icon={PhoneCall}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Active Calls"
          value={liveCalls?.length || 0}
          change="Currently ongoing"
          changeType="positive"
          icon={PhoneCall}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
      </div>

      {/* Call Logs Table */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 sm:p-4 rounded-xl shadow-md dark:shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="dark:text-white">Call Logs</CardTitle>
              <div className="flex items-center gap-2">
                <ExportDropdown
                  onExport={handleExport}
                  disabled={filteredCallLogs.length === 0}
                  isLoading={isExporting}
                  exportScope={exportScope}
                  hasSelectedRows={selectedRows.size > 0}
                  hasFilters={searchQuery || statusFilter !== "all" || callTypeFilter !== "all"}
                />
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col space-y-5 sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by name, phone, or purpose..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={callTypeFilter} onValueChange={setCallTypeFilter}>
                  <SelectTrigger className="w-[150px] dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                    <SelectValue placeholder="Call Type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="table-auto ">
              <TableHeader className={`mb-5`}>
                <TableRow className="dark:border-gray-700 ">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedCallLogs.length > 0 && paginatedCallLogs.every(call => selectedRows.has(call.id))}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Type</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Caller</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Phone Number</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Status</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Duration</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Time</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Purpose</TableHead>
                  <TableHead className="dark:text-gray-300 whitespace-nowrap">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCallLogs.length === 0 ? (
                  <TableRow className="dark:border-gray-700">
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No call logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCallLogs.map((call) => {
                    const CallTypeIcon = callTypeIcons[call.callType] || PhoneCall;
                    const StatusIcon = statusIcons[call.status] || PhoneCall;
                    
                    return (
                      <TableRow key={call.id} className="dark:border-gray-700 table-row">
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(call.id)}
                            onCheckedChange={() => handleSelectRow(call.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CallTypeIcon 
                              className={`w-4 h-4 ${
                                call.callType === "incoming" 
                                  ? "text-blue-500" 
                                  : "text-green-500"
                              }`} 
                            />
                            <span className="text-xs font-medium dark:text-gray-300 capitalize">
                              {call.callType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium dark:text-gray-300 whitespace-nowrap">
                          {call.callerName}
                        </TableCell>
                        <TableCell className="dark:text-gray-300 whitespace-nowrap">
                          {call.phoneNumber}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${statusColors[call.status]} flex items-center gap-1 w-fit`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span className="capitalize">{call.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 dark:text-gray-300">
                            <Clock className="w-3 h-3" />
                            <span className="text-sm">{call.duration}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 dark:text-gray-300">
                            <Calendar className="w-3 h-3" />
                            <span className="text-sm whitespace-nowrap">
                              {formatTimestamp(call.timestamp)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-gray-300 whitespace-nowrap">
                          {call.purpose}
                        </TableCell>
                        <TableCell className="dark:text-gray-300 max-w-xs truncate">
                          {call.notes}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {filteredCallLogs.length > 0 && (
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCallLogs.length)} of {filteredCallLogs.length} entries
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

        {/* Create Call Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Add New Call Log</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Record a new call entry
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Caller Name *</label>
                  <Input
                    placeholder="Enter caller name"
                    value={newCall.callerName}
                    onChange={(e) => setNewCall({ ...newCall, callerName: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Phone Number *</label>
                  <Input
                    placeholder="Enter phone number"
                    value={newCall.phoneNumber}
                    onChange={(e) => setNewCall({ ...newCall, phoneNumber: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Call Type</label>
                  <Select value={newCall.callType} onValueChange={(value) => setNewCall({ ...newCall, callType: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="incoming">Incoming</SelectItem>
                      <SelectItem value="outgoing">Outgoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Status</label>
                  <Select value={newCall.status} onValueChange={(value) => setNewCall({ ...newCall, status: value })}>
                    <SelectTrigger className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Duration (MM:SS)</label>
                  <Input
                    placeholder="00:00"
                    value={newCall.duration}
                    onChange={(e) => setNewCall({ ...newCall, duration: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium dark:text-gray-300">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={newCall.timestamp}
                    onChange={(e) => setNewCall({ ...newCall, timestamp: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium dark:text-gray-300">Purpose</label>
                  <Input
                    placeholder="Enter call purpose"
                    value={newCall.purpose}
                    onChange={(e) => setNewCall({ ...newCall, purpose: e.target.value })}
                    className="mt-1 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium dark:text-gray-300">Notes</label>
                  <Input
                    placeholder="Enter notes (optional)"
                    value={newCall.notes}
                    onChange={(e) => setNewCall({ ...newCall, notes: e.target.value })}
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
                  setNewCall({ callerName: '', phoneNumber: '', callType: 'incoming', status: 'completed', duration: '00:00', timestamp: new Date().toISOString().slice(0, 16), purpose: '', notes: '' });
                }}
                className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCall}>
                Create Call Log
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
        />
      </Card>
    </div>
  );
}

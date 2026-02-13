import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import { Label } from "./ui/label.jsx";
import { Calendar, FileText } from "lucide-react";

export function ExportConfigModal({
  open,
  onOpenChange,
  onConfirm,
  columns = [],
  defaultFormat = "csv",
  defaultOrientation = "portrait",
  showDateRange = true,
  showColumnSelection = true,
  showSummaryOption = false,
  showScopeSelection = false,
  defaultScope = "all",
  hasSelectedRows = false,
  hasFilters = false,
}) {
  const [format, setFormat] = useState(defaultFormat);
  const [orientation, setOrientation] = useState(defaultOrientation);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedColumns, setSelectedColumns] = useState(
    columns.map(col => col.key)
  );
  const [includeSummary, setIncludeSummary] = useState(false);
  const [exportScope, setExportScope] = useState(defaultScope);

  // Reset state when modal opens or defaultFormat changes
  useEffect(() => {
    if (open) {
      setFormat(defaultFormat);
      setOrientation(defaultOrientation);
      setStartDate("");
      setEndDate("");
      setSelectedColumns(columns.map(col => col.key));
      setIncludeSummary(false);
      setExportScope(defaultScope);
    }
  }, [open, defaultFormat, defaultOrientation, columns, defaultScope]);

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map(col => col.key));
    }
  };

  const handleConfirm = () => {
    if (selectedColumns.length === 0) {
      return;
    }

    onConfirm({
      format,
      orientation,
      startDate: startDate || null,
      endDate: endDate || null,
      columns: selectedColumns,
      includeSummary,
      exportScope: showScopeSelection ? exportScope : defaultScope,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <FileText className="w-5 h-5" />
            Export Configuration
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Configure your export settings and select the data to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Scope Selection */}
          {showScopeSelection && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Export Scope
              </Label>
              <Select value={exportScope} onValueChange={setExportScope}>
                <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="all">All Records</SelectItem>
                  {hasFilters && <SelectItem value="filtered">Filtered Results</SelectItem>}
                  {hasSelectedRows && <SelectItem value="selected">Selected Rows</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {exportScope === "all" && "Export all records from the database"}
                {exportScope === "filtered" && "Export only the filtered results"}
                {exportScope === "selected" && "Export only the selected rows"}
              </p>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              File Format
            </Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                <SelectItem value="pdf">PDF (Professional Report)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PDF Orientation (only for PDF) */}
          {format === "pdf" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page Orientation
              </Label>
              <Select value={orientation} onValueChange={setOrientation}>
                <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          {showDateRange && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-gray-400">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Column Selection */}
          {showColumnSelection && columns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Columns
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-7"
                >
                  {selectedColumns.length === columns.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`column-${column.key}`}
                        checked={selectedColumns.includes(column.key)}
                        onCheckedChange={() => handleColumnToggle(column.key)}
                      />
                      <Label
                        htmlFor={`column-${column.key}`}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                      >
                        {column.label || column.key}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedColumns.length === 0 && (
                <p className="text-xs text-red-500">Please select at least one column</p>
              )}
            </div>
          )}

          {/* Summary Option */}
          {showSummaryOption && format === "pdf" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-summary"
                checked={includeSummary}
                onCheckedChange={(checked) => setIncludeSummary(checked)}
              />
              <Label
                htmlFor="include-summary"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Include summary totals
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedColumns.length === 0}
            className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500"
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


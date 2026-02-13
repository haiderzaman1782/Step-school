import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "./ui/button.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover.jsx";
import { cn } from "./ui/utils.js";

export function ExportDropdown({ 
  onExport, 
  disabled = false, 
  isLoading = false,
  exportScope = "all", // "all", "filtered", "selected"
  hasSelectedRows = false,
  hasFilters = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format) => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isLoading}
          className="gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 dark:bg-gray-800 dark:border-gray-700" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Export Format
          </div>
          <button
            onClick={() => handleExport("csv")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              "text-gray-700 dark:text-gray-300"
            )}
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>Export as CSV</span>
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              "text-gray-700 dark:text-gray-300"
            )}
          >
            <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Export as PDF</span>
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
            {exportScope === "all" && "Exporting all records"}
            {exportScope === "filtered" && "Exporting filtered results"}
            {exportScope === "selected" && "Exporting selected rows"}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


// jsPDF will be loaded dynamically when needed

/**
 * Export data to CSV format
 */
export const exportToCSV = (data, columns, filename = "export") => {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  if (!columns || columns.length === 0) {
    throw new Error("No columns specified for export");
  }

  // Create CSV header
  const headers = columns.map(col => col.label || col.key);
  const csvRows = [headers.join(",")];

  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key];
      // Handle null/undefined values
      if (value === null || value === undefined) return "";
      // Escape commas and quotes in values
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  });

  // Create CSV content
  const csvContent = csvRows.join("\n");
  
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Download file
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to PDF format
 */
export const exportToPDF = async (data, columns, options = {}) => {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  if (!columns || columns.length === 0) {
    throw new Error("No columns specified for export");
  }

  // Try to load jsPDF and jspdf-autotable dynamically
  let jsPDFLib;
  let autoTableAvailable = false;
  
  try {
    // Import jspdf-autotable first so it can extend jsPDF
    try {
      await import("jspdf-autotable");
      autoTableAvailable = true;
    } catch (e) {
      // jspdf-autotable not available, using basic table generation
    }
    
    // Then import jsPDF
    const jsPDFModule = await import("jspdf");
    jsPDFLib = jsPDFModule.default;
  } catch (e) {
    throw new Error("PDF export requires jsPDF. Please install it: npm install jspdf jspdf-autotable");
  }

  const {
    filename = "export",
    title = "Export Report",
    companyName = "AI Booking Voice System",
    companyLogo = null,
    orientation = "portrait",
    includeSummary = false,
    summaryData = null,
  } = options;

  // Create PDF document
  const doc = new jsPDFLib({
    orientation: orientation === "landscape" ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPosition = 20;

  // Add company logo if provided
  if (companyLogo) {
    try {
      doc.addImage(companyLogo, "PNG", 14, yPosition, 30, 10);
      yPosition += 15;
    } catch (error) {
      // Could not add logo to PDF
    }
  }

  // Add company name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 14, yPosition);
  yPosition += 8;

  // Add title
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, yPosition);
  yPosition += 6;

  // Add export date and time
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Exported on: ${new Date().toLocaleString()}`,
    14,
    yPosition
  );
  yPosition += 10;

  // Prepare table data
  const tableData = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return "";
      return String(value);
    })
  );

  const tableHeaders = columns.map(col => col.label || col.key);

  // Add table using autoTable if available, otherwise use basic table
  if (autoTableAvailable && typeof doc.autoTable === 'function') {
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: "linebreak",
        halign: "center", // Center-align all cell content
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center", // Center-align header text
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
        halign: "center", // Center-align alternate rows
      },
      margin: { top: yPosition, left: 14, right: 14 },
      didDrawPage: (data) => {
        // Add page numbers
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const pageCount = doc.internal.getNumberOfPages();
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      },
    });
  } else {
    // Basic table generation without autoTable
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const colWidth = (doc.internal.pageSize.getWidth() - 28) / tableHeaders.length;
    let xPos = 14;
    tableHeaders.forEach((header, index) => {
      const cellCenterX = xPos + colWidth / 2;
      doc.text(header, cellCenterX, yPosition, { align: "center" });
      xPos += colWidth;
    });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    tableData.forEach((row, rowIndex) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPosition = 20;
      }
      xPos = 14;
      row.forEach((cell, colIndex) => {
        const cellCenterX = xPos + colWidth / 2;
        doc.text(String(cell).substring(0, 20), cellCenterX, yPosition, { align: "center" });
        xPos += colWidth;
      });
      yPosition += 6;
    });
  }

  // Add summary if requested
  if (includeSummary && summaryData) {
    const finalY = (autoTableAvailable && doc.lastAutoTable) ? doc.lastAutoTable.finalY : yPosition + 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Summary", 14, finalY + 10);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    Object.entries(summaryData).forEach(([key, value], index) => {
      doc.text(`${key}: ${value}`, 14, finalY + 20 + index * 6);
    });
  }

  // Save PDF
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
};

/**
 * Format date for export
 */
export const formatDateForExport = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Format datetime for export
 */
export const formatDateTimeForExport = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date and time combined for PDF export (MM/DD/YYYY HH:MM AM/PM)
 */
export const formatDateTimeCombined = (dateString, timeString) => {
  if (!dateString) return "N/A";
  
  try {
    // Parse the date
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    // Parse the time string (could be "HH:MM", "HH:MM AM/PM", "HH:MM:SS", etc.)
    let hours = 0;
    let minutes = 0;
    let ampm = '';
    
    if (timeString) {
      // Handle time formats like "14:30", "2:30 PM", "14:30:00", etc.
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
      if (timeMatch) {
        let parsedHours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : '';
        
        // If AM/PM is specified, use it directly
        if (ampm) {
          if (ampm === 'AM') {
            if (parsedHours === 12) {
              hours = 0;
            } else {
              hours = parsedHours;
            }
            ampm = 'AM';
          } else { // PM
            if (parsedHours === 12) {
              hours = 12;
            } else {
              hours = parsedHours;
            }
            ampm = 'PM';
          }
        } else {
          // No AM/PM specified, assume 24-hour format and convert to 12-hour
          if (parsedHours === 0) {
            hours = 12;
            ampm = 'AM';
          } else if (parsedHours < 12) {
            hours = parsedHours;
            ampm = 'AM';
          } else if (parsedHours === 12) {
            hours = 12;
            ampm = 'PM';
          } else {
            hours = parsedHours - 12;
            ampm = 'PM';
          }
        }
      } else {
        // Try to parse as just hours:minutes
        const parts = timeString.split(':');
        if (parts.length >= 2) {
          const parsedHours = parseInt(parts[0], 10);
          minutes = parseInt(parts[1], 10);
          
          // Convert to 12-hour format
          if (parsedHours === 0) {
            hours = 12;
            ampm = 'AM';
          } else if (parsedHours < 12) {
            hours = parsedHours;
            ampm = 'AM';
          } else if (parsedHours === 12) {
            hours = 12;
            ampm = 'PM';
          } else {
            hours = parsedHours - 12;
            ampm = 'PM';
          }
        }
      }
    } else {
      // Use time from date object if no time string provided
      const dateHours = date.getHours();
      minutes = date.getMinutes();
      
      // Convert to 12-hour format
      if (dateHours === 0) {
        hours = 12;
        ampm = 'AM';
      } else if (dateHours < 12) {
        hours = dateHours;
        ampm = 'AM';
      } else if (dateHours === 12) {
        hours = 12;
        ampm = 'PM';
      } else {
        hours = dateHours - 12;
        ampm = 'PM';
      }
    }
    
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    
    return `${month}/${day}/${year} ${formattedHours}:${formattedMinutes} ${ampm}`;
  } catch (error) {
    return "N/A";
  }
};


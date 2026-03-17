"use client";

import { useState } from "react";
import { Printer, FileDown, FileSpreadsheet, FileText, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export interface ColumnOption {
  key: string;
  label: string;
  default?: boolean;
}

export interface ExportPrintOptions {
  type: "orders" | "customers";
  columns: ColumnOption[];
  data: Record<string, unknown>[];
  selectedIds?: string[];
  filters?: Record<string, string>;
  sortBy?: string;
  sortOrder?: string;
  totalCount?: number;
}

interface ExportPrintDialogProps {
  options: ExportPrintOptions;
  onExport: (config: ExportConfig) => Promise<void>;
  onPrint: (config: PrintConfig) => void;
  children?: React.ReactNode;
}

export interface ExportConfig {
  format: "csv" | "excel" | "pdf";
  columns: string[];
  scope: "all" | "filtered" | "selected";
  includeFilters: boolean;
  includeSort: boolean;
}

export interface PrintConfig {
  columns: string[];
  scope: "all" | "filtered" | "selected";
  title?: string;
}

export function ExportPrintDialog({ options, onExport, onPrint, children }: ExportPrintDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(options.columns.filter(c => c.default !== false).map(c => c.key))
  );
  const [scope, setScope] = useState<"filtered" | "selected">("filtered");
  const [includeFilters, setIncludeFilters] = useState(true);
  const [includeSort, setIncludeSort] = useState(true);
  const [format, setFormat] = useState<"csv" | "excel" | "pdf">("csv");

  const allColumnsSelected = selectedColumns.size === options.columns.length;
  const someColumnsSelected = selectedColumns.size > 0 && selectedColumns.size < options.columns.length;

  const toggleColumn = (key: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedColumns(newSelected);
  };

  const toggleAllColumns = () => {
    if (allColumnsSelected) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(options.columns.map(c => c.key)));
    }
  };

  const handleExport = async () => {
    if (selectedColumns.size === 0) {
      toast.error("Please select at least one column");
      return;
    }

    const selectedScope = options.selectedIds && options.selectedIds.length > 0 ? scope : "filtered";
    
    setExporting(true);
    try {
      await onExport({
        format,
        columns: Array.from(selectedColumns),
        scope: selectedScope,
        includeFilters,
        includeSort,
      });
      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (selectedColumns.size === 0) {
      toast.error("Please select at least one column");
      return;
    }

    const selectedScope = options.selectedIds && options.selectedIds.length > 0 ? scope : "filtered";
    
    onPrint({
      columns: Array.from(selectedColumns),
      scope: selectedScope,
      title: options.type === "orders" ? "Orders Report" : "Customers Report",
    });
    setOpen(false);
  };

  const showSelectedOption = options.selectedIds && options.selectedIds.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="rounded-xl gap-2">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Export / Print</h4>
            <p className="text-xs text-muted-foreground">
              {options.totalCount ? `${options.totalCount} record(s) available` : `${options.data.length} record(s) shown`}
              {showSelectedOption && ` • ${options.selectedIds?.length} selected`}
            </p>
          </div>

          {showSelectedOption && (
            <div className="space-y-2">
              <label className="text-xs font-medium">Scope</label>
              <div className="flex gap-2">
                <Button
                  variant={scope === "filtered" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setScope("filtered")}
                >
                  Filtered
                </Button>
                <Button
                  variant={scope === "selected" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setScope("selected")}
                >
                  Selected ({options.selectedIds?.length})
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center justify-between">
              <span>Columns</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={toggleAllColumns}
              >
                {allColumnsSelected ? "Deselect All" : "Select All"}
              </Button>
            </label>
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
              {options.columns.map((col) => (
                <div key={col.key} className="flex items-center gap-2 py-1">
                  <Checkbox
                    id={`col-${col.key}`}
                    checked={selectedColumns.has(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  <label
                    htmlFor={`col-${col.key}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {col.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Options</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeFilters"
                  checked={includeFilters}
                  onCheckedChange={(v) => setIncludeFilters(!!v)}
                />
                <label htmlFor="includeFilters" className="text-sm cursor-pointer">
                  Respect current filters
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeSort"
                  checked={includeSort}
                  onCheckedChange={(v) => setIncludeSort(!!v)}
                />
                <label htmlFor="includeSort" className="text-sm cursor-pointer">
                  Respect current sort
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Format</label>
            <div className="flex gap-1">
              <Button
                variant={format === "csv" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setFormat("csv")}
              >
                <FileText className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button
                variant={format === "excel" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setFormat("excel")}
              >
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                Excel
              </Button>
              <Button
                variant={format === "pdf" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setFormat("pdf")}
              >
                <FileText className="h-3 w-3 mr-1" />
                PDF
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handlePrint}
              disabled={exporting}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                "Exporting..."
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-1" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

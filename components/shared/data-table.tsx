"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

export interface DataColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  data: T[];
  columns: DataColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: (row: T) => string | number;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  dateStart?: string;
  dateEnd?: string;
  onDateStartChange?: (value: string) => void;
  onDateEndChange?: (value: string) => void;
  extraFilters?: ReactNode;
}

export function DataTable<T>({
  title,
  data,
  columns,
  loading = false,
  emptyMessage = "No records found.",
  rowKey,
  searchValue,
  searchPlaceholder = "Search...",
  onSearchChange,
  dateStart,
  dateEnd,
  onDateStartChange,
  onDateEndChange,
  extraFilters,
}: DataTableProps<T>) {
  const showSearch = typeof onSearchChange === "function";
  const showDateFilters = typeof onDateStartChange === "function" || typeof onDateEndChange === "function";

  return (
    <Card>
      {(title || showSearch || showDateFilters || extraFilters) && (
        <CardHeader className="space-y-4">
          {title ? <CardTitle>{title}</CardTitle> : null}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {showSearch ? (
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchValue ?? ""}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-9"
                />
              </div>
            ) : null}
            {showDateFilters ? (
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                <Input type="date" value={dateStart ?? ""} onChange={(event) => onDateStartChange?.(event.target.value)} />
                <Input type="date" value={dateEnd ?? ""} onChange={(event) => onDateEndChange?.(event.target.value)} />
              </div>
            ) : null}
            {extraFilters}
          </div>
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={rowKey ? rowKey(row) : index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>{column.render(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

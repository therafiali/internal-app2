// DynamicTable.tsx




//  remove pagination

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState } from "react";

type DynamicTableProps<TData> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  pagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  limit?: number;
  onPageChange?: (pageIndex: number) => void;
  onRowClick?: (row: TData) => void;
  onSearchChange?: (search: string) => void;
};

export function DynamicTable<TData>({
  columns,
  data,
  pagination = false,
  pageCount,
  pageIndex = 0,
  limit = 100,
  onPageChange,
  onRowClick,
  onSearchChange,
}: DynamicTableProps<TData>) {
  const [search, setSearch] = useState("");

  // Filter data by search text (case-insensitive, any cell)
  // Only filter here if parent component is not handling search
  const filteredData = (search && !onSearchChange)
    ? data.filter((row) =>
        Object.values(row as Record<string, unknown>).some((value) =>
          String(value).toLowerCase().trim().includes(search.toLowerCase().trim())
        )
      )
    : data;

  const table = useReactTable<TData>({
    data: filteredData,
    columns,
    pageCount: pagination ? (pageCount || Math.ceil(filteredData.length / limit)) : Math.ceil(filteredData.length / limit),
    state: {
      pagination: {
        pageIndex,
        pageSize: limit,
      },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize: limit })
          : updater;
      onPageChange?.(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: pagination, // true = server pagination, false = client pagination
  });

  const pageData = pagination
    ? filteredData // server already gives paginated data
    : filteredData.slice(pageIndex * limit, (pageIndex + 1) * limit);

  // Calculate total pages for dynamic pagination
  const totalPages = pageCount || Math.ceil(filteredData.length / limit);
  
  // Limit page numbers display (max 5 pages + next/prev)
  const maxVisiblePages = 5;
  const getVisiblePageNumbers = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    
    const startPage = Math.max(0, Math.min(pageIndex - 2, totalPages - maxVisiblePages));
    return Array.from({ length: maxVisiblePages }, (_, i) => startPage + i);
  };
  
  const visiblePageNumbers = getVisiblePageNumbers();

  return (
    <>
      {/* Search Bar - Removed to prevent conflicts with custom search */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm text-white">
          <thead className="bg-gray-800 text-center">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-center font-semibold tracking-wide first:rounded-tl-xl last:rounded-tr-xl text-gray-100"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="bg-gray-900">
            {pageData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-gray-700 last:border-0 hover:bg-gray-700 transition-colors text-center ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(row)}
              >
                              {columns.map((column, colIndex) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const accessorKey = (column as any).accessorKey as keyof TData | undefined;
                  return (
                    <td
                      key={colIndex}
                      className="px-4 py-2 align-middle first:rounded-bl-xl last:rounded-br-xl text-white"
                    >
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {flexRender(
                        column.cell ??
                          (({ row }: { row: { original: TData } }) =>
                            accessorKey ? row.original[accessorKey] as any : undefined),
                        {
                          row: { original: row } as any,
                          getValue: () =>
                            accessorKey ? row[accessorKey] as any : undefined,
                        } as any
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(pagination || totalPages > 1) && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => onPageChange?.(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="px-3 py-2 rounded-md bg-gray-700 text-gray-100 hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Prev
          </button>
          {visiblePageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => onPageChange?.(num)}
              className={`px-3 py-2 rounded-md transition font-medium shadow ${
                num === pageIndex
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-100 hover:bg-gray-600"
              }`}
            >
              {num + 1}
            </button>
          ))}
          <button
            onClick={() => onPageChange?.(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
            className="px-3 py-2 rounded-md bg-gray-700 text-gray-100 hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

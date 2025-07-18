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
  columns: ColumnDef<TData, any>[];
  data: TData[];
  pagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  limit?: number;
  onPageChange?: (pageIndex: number) => void;
};

export function DynamicTable<TData>({
  columns,
  data,
  pagination = false,
  pageIndex = 0,
  limit = 100,
  onPageChange,
}: DynamicTableProps<TData>) {
  const [search, setSearch] = useState("");

  // Filter data by search text (case-insensitive, any cell)
  const filteredData = search
    ? data.filter((row) =>
        Object.values(row as Record<string, unknown>).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const table = useReactTable<TData>({
    data: filteredData,
    columns,
    pageCount: pagination ? Math.ceil(filteredData.length / limit) : undefined,
    state: pagination
      ? {
          pagination: {
            pageIndex,
            pageSize: limit,
          },
        }
      : undefined,
    onPaginationChange: pagination
      ? (updater) => {
          const next =
            typeof updater === "function"
              ? updater({ pageIndex, pageSize: limit })
              : updater;
          onPageChange?.(next.pageIndex);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: pagination,
  });

  const pageData = pagination
    ? filteredData // server already gives paginated data
    : filteredData.slice(pageIndex * limit, (pageIndex + 1) * limit);

  // Calculate total pages for dynamic pagination
  const totalPages = Math.ceil(filteredData.length / limit);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <>
      {/* Search Bar */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="px-3 py-2 border rounded-md w-64 text-sm focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>
      <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[hsl(var(--sidebar-border))] text-sm text-[hsl(var(--sidebar-foreground))]">
          <thead className="bg-[hsl(var(--sidebar-accent))]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-semibold tracking-wide first:rounded-tl-xl last:rounded-tr-xl text-[hsl(var(--sidebar-accent-foreground))]"
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

          <tbody className="bg-[hsl(var(--sidebar-background))]">
            {pageData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-[hsl(var(--sidebar-border))] last:border-0 hover:bg-[hsl(var(--sidebar-accent))]/60 transition-colors"
              >
                {columns.map((column, colIndex) => {
                  const accessorKey = (column as any).accessorKey as keyof TData | undefined;
                  return (
                    <td
                      key={colIndex}
                      className="px-4 py-2 align-middle first:rounded-bl-xl last:rounded-br-xl text-[hsl(var(--sidebar-foreground))]"
                    >
                      {flexRender(
                        column.cell ??
                          (({ row }: { row: { original: TData } }) =>
                            accessorKey ? row.original[accessorKey] as any : undefined),
                        {
                          row: { original: row },
                          getValue: () =>
                            accessorKey ? row[accessorKey] : undefined,
                        }
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => onPageChange?.(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="px-3 py-2 rounded-md bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] hover:bg-[hsl(var(--sidebar-primary))] hover:text-[hsl(var(--sidebar-primary-foreground))] transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Prev
          </button>
          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => onPageChange?.(num)}
              className={`px-3 py-2 rounded-md transition font-medium shadow ${
                num === pageIndex
                  ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                  : "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] hover:bg-[hsl(var(--sidebar-primary))]/80 hover:text-[hsl(var(--sidebar-primary-foreground))]"
              }`}
            >
              {num + 1}
            </button>
          ))}
          <button
            onClick={() => onPageChange?.(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
            className="px-3 py-2 rounded-md bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] hover:bg-[hsl(var(--sidebar-primary))]/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

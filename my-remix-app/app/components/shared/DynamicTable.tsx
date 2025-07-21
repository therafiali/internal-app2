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
};

export function DynamicTable<TData>({
  columns,
  data,
  pagination = false,
  pageCount,
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
    pageCount: pagination ? (pageCount || Math.ceil(filteredData.length / limit)) : undefined,
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
  const totalPages = pagination && pageCount ? pageCount : Math.ceil(filteredData.length / limit);
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
      <div className="rounded-xl border border-gray-700 bg-gray-900 shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm text-white">
          <thead className="bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-semibold tracking-wide first:rounded-tl-xl last:rounded-tr-xl text-gray-100"
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
                className="border-b border-gray-700 last:border-0 hover:bg-gray-700 transition-colors"
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

      {pagination && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => onPageChange?.(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="px-3 py-2 rounded-md bg-gray-700 text-gray-100 hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Prev
          </button>
          {pageNumbers.map((num) => (
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

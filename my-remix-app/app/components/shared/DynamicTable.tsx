// DynamicTable.tsx

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

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
  limit = 10,
  onPageChange,
}: DynamicTableProps<TData>) {
  const table = useReactTable<TData>({
    data,
    columns,
    pageCount: pagination ? Math.ceil(data.length / limit) : undefined,
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
    ? data // server already gives paginated data
    : data.slice(pageIndex * limit, (pageIndex + 1) * limit);

  return (
    <>
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
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-2 align-middle first:rounded-bl-xl last:rounded-br-xl text-[hsl(var(--sidebar-foreground))]"
                  >
                    {flexRender(
                      column.cell ??
                        ((cellCtx) =>
                          (row as any)[column.accessorKey as string]),
                      {
                        row: { original: row },
                        getValue: () =>
                          column.accessorKey
                            ? (row as any)[column.accessorKey as string]
                            : undefined,
                      }
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => onPageChange?.(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="px-4 py-2 rounded-md bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))] hover:bg-[hsl(var(--sidebar-primary))] hover:text-[hsl(var(--sidebar-primary-foreground))] transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-[hsl(var(--sidebar-foreground))]">
            Page {pageIndex + 1}
          </span>
          <button
            onClick={() => onPageChange?.(pageIndex + 1)}
            disabled={data.length < limit}
            className="px-4 py-2 rounded-md bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] hover:bg-[hsl(var(--sidebar-primary))]/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

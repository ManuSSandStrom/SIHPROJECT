import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card, CardBody, CardHeader } from "../common/Card";
import { EmptyState } from "../common/EmptyState";

export function DataTable({
  title,
  description,
  columns,
  data,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display yet.",
  actions,
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader title={title} description={description} actions={actions} />
      <CardBody className="overflow-x-auto">
        {!data.length ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="rounded-2xl bg-slate-50/90 shadow-[0_1px_0_rgba(148,163,184,0.08)]">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 text-sm text-slate-700 first:rounded-l-2xl last:rounded-r-2xl">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}

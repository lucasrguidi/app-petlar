'use client'

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Fragment, useState } from 'react'

import type { ColumnDef, ExpandedState, Row } from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// Extend column meta type
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
    headerClassName?: string
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  renderExpandedRow?: (row: Row<TData>) => React.ReactNode
  getRowCanExpand?: (row: Row<TData>) => boolean
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  renderExpandedRow,
  getRowCanExpand,
  className,
}: DataTableProps<TData, TValue>) {
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    getRowCanExpand: getRowCanExpand ?? (() => !!renderExpandedRow),
    state: {
      expanded,
    },
  })

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-xl border',
        className
      )}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'bg-muted/40 border-border/40 h-10 border-b',
                      meta?.className,
                      meta?.headerClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'group border-border/30 transition-colors duration-150',
                    row.getIsExpanded()
                      ? 'bg-primary/[0.03]'
                      : 'hover:bg-muted/40'
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn('py-2', meta?.className)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
                {row.getIsExpanded() && renderExpandedRow && (
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="p-0">
                      {renderExpandedRow(row)}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="text-muted-foreground h-24 text-center"
              >
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

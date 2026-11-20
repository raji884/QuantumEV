import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
  /** Cell renderer. */
  render: (row: T) => ReactNode
  /** Return a sortable primitive to make this column sortable. */
  sortValue?: (row: T) => number | string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
  initialSortKey?: string
  initialSortDesc?: boolean
  pageSize?: number
  /** Highlight a whole row (e.g. priority / critical rows). */
  rowClassName?: (row: T) => string
}

const ALIGN: Record<'left' | 'right' | 'center', string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'Nothing to show.',
  initialSortKey,
  initialSortDesc = false,
  pageSize,
  rowClassName,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey)
  const [sortDesc, setSortDesc] = useState(initialSortDesc)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    const column = columns.find((item) => item.key === sortKey)
    if (!column?.sortValue) return rows
    const getValue = column.sortValue
    return [...rows].sort((a, b) => {
      const left = getValue(a)
      const right = getValue(b)
      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right))
      return sortDesc ? -result : result
    })
  }, [columns, rows, sortKey, sortDesc])

  const totalPages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const safePage = Math.min(page, totalPages - 1)
  const visible = pageSize
    ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)
    : sorted

  const toggleSort = (column: Column<T>) => {
    if (!column.sortValue) return
    if (sortKey === column.key) {
      setSortDesc((previous) => !previous)
    } else {
      setSortKey(column.key)
      setSortDesc(false)
    }
    setPage(0)
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs">
          <thead className="bg-white/[0.04] text-slate-400">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 py-2 font-medium whitespace-nowrap ${ALIGN[column.align ?? 'left']} ${
                    column.sortValue ? 'cursor-pointer select-none hover:text-slate-200' : ''
                  } ${column.className ?? ''}`}
                  onClick={() => toggleSort(column)}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                    {column.sortValue && sortKey === column.key ? (
                      sortDesc ? (
                        <ArrowDown className="size-3" />
                      ) : (
                        <ArrowUp className="size-3" />
                      )
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                className={`transition hover:bg-white/[0.04] ${rowClassName?.(row) ?? ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-2.5 text-slate-300 ${ALIGN[column.align ?? 'left']} ${
                      column.className ?? ''
                    }`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pageSize && totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Page {safePage + 1} of {totalPages} · {sorted.length} rows
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(0, previous - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 transition enabled:hover:border-white/25 enabled:hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 transition enabled:hover:border-white/25 enabled:hover:bg-white/5 disabled:opacity-40"
            >
              Next
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

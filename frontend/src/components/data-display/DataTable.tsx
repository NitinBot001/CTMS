import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table'
import { Icon } from '@/components/primitives/Icon'
import { EmptyState } from '@/components/feedback/EmptyState'
import { TableSkeleton } from '@/components/feedback/Skeleton'

export interface Column<T> {
  key: string
  header: React.ReactNode
  render?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor?: (row: T, index: number) => string
  searchable?: boolean
  searchPlaceholder?: string
  searchFilter?: (row: T, query: string) => boolean
  loading?: boolean
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyMessage?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  pageSize?: number
  headerActions?: React.ReactNode
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchFilter,
  loading: propLoading,
  isLoading,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no records to display.',
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  pageSize = 10,
  headerActions,
  className,
}: DataTableProps<T>) {
  const loading = propLoading ?? isLoading ?? false
  const emptyDesc = emptyMessage || emptyDescription
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Search Filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase()

    if (searchFilter) {
      return data.filter((row) => searchFilter(row, query))
    }

    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false
        return String(val).toLowerCase().includes(query)
      })
    })
  }, [data, searchQuery, searchFilter])

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })
  }, [filteredData, sortKey, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else {
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return <TableSkeleton rows={pageSize > 6 ? 6 : pageSize} columns={columns.length} />
  }

  return (
    <div className={cn('bg-white border border-[#E4DED3] rounded-xs shadow-xs overflow-hidden', className)}>
      {/* Table Toolbar */}
      {(searchable || headerActions) && (
        <div className="p-3 border-b border-[#E4DED3] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white">
          {searchable ? (
            <div className="relative flex-1 max-w-sm">
              <Icon
                name="search"
                size="sm"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#726B5C]"
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#C9C2B3] rounded-xs bg-white text-[#1C1A17] focus:outline-2 focus:outline-[#B8862E]"
              />
            </div>
          ) : (
            <div />
          )}

          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Table */}
      {paginatedData.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={searchQuery ? 'No records match your search criteria.' : emptyDesc}
          actionLabel={searchQuery ? undefined : emptyActionLabel}
          onAction={onEmptyAction}
          className="border-0 rounded-none py-12"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(col.sortable && 'cursor-pointer hover:bg-[#F3EFE8] select-none', col.headerClassName)}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-[#726B5C]">
                        {sortKey === col.key ? (
                          sortOrder === 'asc' ? (
                            <Icon name="chevron-up" size="xs" />
                          ) : (
                            <Icon name="chevron-down" size="xs" />
                          )
                        ) : (
                          <span className="opacity-30">↕</span>
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => {
              const key = keyExtractor ? keyExtractor(row, index) : (row.id as string) || index.toString()
              return (
                <TableRow key={key}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row, index) : (row[col.key] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {/* Pagination Footer */}
      {sortedData.length > pageSize && (
        <div className="px-4 py-3 border-t border-[#E4DED3] bg-[#F8F6F2] flex items-center justify-between text-xs text-[#5A5347]">
          <div>
            Showing <span className="font-semibold text-[#1C1A17]">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-[#1C1A17]">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-semibold text-[#1C1A17]">{sortedData.length}</span> records
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-2 py-1 border border-[#C9C2B3] bg-white rounded-xs text-[#1C1A17] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F6F2] cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 py-1 font-semibold text-[#1C1A17]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-2 py-1 border border-[#C9C2B3] bg-white rounded-xs text-[#1C1A17] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F6F2] cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

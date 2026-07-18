import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type Updater,
} from "@tanstack/react-table";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo, useCallback, useState, useEffect } from "react";
import type { SortingState } from "@tanstack/react-table";
import TableLoading, { TableLoadingOverlay } from "./TableLoading";
import {
  ArrowDown,
  ArrowUp,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileX,
  Search,
} from "lucide-react";
import FormButton from "./FormButton.tsx";

interface FilterField {
  field: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select";
  options?: Array<{ value: string; label: string }>;
}

interface QueryData {
  listResult?: unknown[];
  total?: number;
  totalPages?: number;
}

interface DataTableProps<T> {
  // Data and query configuration
  query: UseQueryResult<QueryData, Error>;

  // State management callbacks
  onSortingChange?: (sorting: SortingState) => void;
  onPaginationChange: (pagination: PaginationState) => void;
  onFiltersChange: (filters: Array<{ key: string; value: string }>) => void;

  // Current state
  sorting?: SortingState;
  pagination: PaginationState;
  filters: Array<{ key: string; value: string }>;

  // Table configuration
  columns: ColumnDef<T, string | number | boolean | null | undefined>[];
  filterFields: FilterField[];

  // NEW: Search mode - "instant" (default) or "onEnter"
  searchMode?: "instant" | "onEnter";

  // UI customization
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  loadingMessage?: string;
  skeletonColumns?: number;

  // Optional styling
  className?: string;
}

export default function DataTable<T>({
  query,
  onPaginationChange,
  onFiltersChange,
  pagination,
  filters,
  columns,
  filterFields,
  searchMode = "instant",
  emptyStateMessage = "هیچ داده‌ای یافت نشد",
  emptyStateDescription = "هنوز داده‌ای وجود ندارد.",
  loadingMessage,
  skeletonColumns = 5,
  className = "relative",
}: DataTableProps<T>) {
  const currentData = (query.data?.listResult || []) as T[];
  const totalCount = query.data?.total || 0;
  const totalPages = query.data?.totalPages || 1;

  const [localSorting, setLocalSorting] = useState<SortingState>([]);

  const rowNumberColumn: ColumnDef<
    T,
    string | number | boolean | null | undefined
  > = {
    id: "rowNumber",
    header: "ردیف",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      return pageIndex * pageSize + row.index + 1;
    },
  };

  const allColumns = useMemo(() => [rowNumberColumn, ...columns], [columns]);

  const handlePaginationChange = useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === "function") {
        const newState = updaterOrValue(pagination);
        onPaginationChange(newState);
      } else {
        onPaginationChange(updaterOrValue);
      }
    },
    [pagination, onPaginationChange],
  );

  const table = useReactTable({
    data: currentData,
    columns: allColumns,
    state: {
      sorting: localSorting,
      pagination,
    },
    onSortingChange: setLocalSorting,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const [selectedField, setSelectedField] = useState(
    filterFields.length ? filterFields[0].field : "",
  );
  const [searchValue, setSearchValue] = useState("");

  // گرفتن اطلاعات فیلد انتخاب شده
  const currentFilterField = filterFields.find(
    (f) => f.field === selectedField,
  );
  const isSelectField = currentFilterField?.type === "select";

  // وقتی فیلد عوض میشه، مقدار جستجو رو ریست کن
  useEffect(() => {
    setSearchValue("");
  }, [selectedField]);

  const applyFilter = useCallback(
    (key: string, value: string) => {
      const newFilters = filters.filter((f) => f.key !== key);
      if (value.trim()) {
        newFilters.push({ key, value: value.trim() });
      }
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setSearchValue(value);

      if (searchMode === "instant" || isSelectField) {
        applyFilter(key, value);
      }
    },
    [searchMode, applyFilter, isSelectField],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchMode === "onEnter") {
      applyFilter(selectedField, searchValue);
    }
  };

  const handleSearchClick = () => {
    if (searchMode === "onEnter") {
      applyFilter(selectedField, searchValue);
    }
  };

  // Show full loading skeleton only on initial load with no previous data
  if (query.isLoading && !query.data) {
    return <TableLoading rows={5} columns={skeletonColumns} />;
  }

  return (
    <div className={className}>
      <TableLoadingOverlay
        isLoading={query.isFetching && !!query.data}
        message={loadingMessage}
      />

      {/* Filters Section */}
      {filterFields.length > 0 && (
        <div className="p-2 bg-blue-100 dark:bg-slate-900 rounded-lg mb-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="flex items-end">
                <div className="relative">
                  <select
                    className="bg-white dark:bg-slate-700 rounded-lg text-sm pr-3 pl-8 py-1 appearance-none outline-none dark:text-white"
                    id="filterField"
                    name="filterField"
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                  >
                    {filterFields.map((opt) => (
                      <option key={opt.field} value={opt.field}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute top-1.5 transform w-4 h-4 text-black pointer-events-none left-1 dark:text-white" />
                </div>
              </div>
              <div className="flex items-end gap-1">
                {isSelectField ? (
                  // نمایش select برای فیلدهای نوع select
                  <select
                    className="bg-white dark:bg-slate-700 rounded-lg text-sm px-3 py-1 outline-none dark:text-white"
                    value={searchValue}
                    onChange={(e) => {
                      handleFilterChange(selectedField, e.target.value);
                    }}
                  >
                    <option value="">همه</option>
                    {currentFilterField?.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  // نمایش input معمولی برای فیلدهای متنی
                  <>
                    <input
                      id="filterValue"
                      placeholder={currentFilterField?.placeholder || "جستجو"}
                      dir="rtl"
                      className="bg-white rounded-lg text-sm px-3 py-1 outline-none dark:bg-slate-700 dark:placeholder-gray-400"
                      type="text"
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        if (searchMode === "instant") {
                          handleFilterChange(selectedField, e.target.value);
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      name="filterValue"
                      autoComplete="off"
                    />
                    {searchMode === "onEnter" && (
                      <button
                        onClick={handleSearchClick}
                        className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors cursor-pointer"
                        title="جستجو (Enter)"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-end">
              <div className="relative">
                <select
                  className="bg-white rounded-lg text-sm pr-3 pl-8 py-1 appearance-none outline-none dark:bg-slate-700 dark:text-white"
                  id="page-size"
                  name="page-size"
                  value={pagination.pageSize}
                  onChange={(e) =>
                    onPaginationChange({
                      pageIndex: 0,
                      pageSize: Number(e.target.value),
                    })
                  }
                >
                  <option value="10">10 ردیف</option>
                  <option value="25">25 ردیف</option>
                  <option value="50">50 ردیف</option>
                  <option value="100">100 ردیف</option>
                </select>
                <ChevronDown className="absolute top-1.5 transform w-4 h-4 text-black pointer-events-none left-1 dark:text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* بقیه کد بدون تغییر */}
      <div className="bg-blue-100 dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-100 dark:divide-slate-900">
            <thead className="bg-blue-100 dark:bg-slate-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2 text-right text-xs font-medium text-black dark:text-gray-300 uppercase tracking-wider select-none outline-none focus:outline-none active:outline-none"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <div className="flex items-center space-x-1 space-x-reverse">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() && (
                          <span className="text-gray-500 dark:text-gray-300">
                            {header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="mr-1 w-3 h-3" />
                            ) : (
                              <ArrowUp className="mr-1 w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-slate-700 divide-y divide-blue-100 dark:divide-slate-900">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-3 whitespace-nowrap text-xs dark:text-white"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {query.isError && !query.isLoading && (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-slate-700">
            <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400 mb-3" />
            <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">
              خطا در دریافت اطلاعات
            </p>
            <FormButton title="تلاش مجدد" onClick={() => query.refetch()} />
          </div>
        )}

        {table.getRowModel().rows.length === 0 &&
          !query.isLoading &&
          !query.isError && (
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-slate-700">
              <FileX className="w-10 h-10 text-gray-400 dark:text-slate-500 mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {emptyStateMessage}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs text-center">
                {filters.length > 0
                  ? "نتیجه‌ای برای فیلترهای شما یافت نشد."
                  : emptyStateDescription}
              </p>
            </div>
          )}

        {table.getRowModel().rows.length > 0 && (
          <div className="px-3 py-2 border-t border-blue-100 dark:border-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-xs font-medium text-block dark:text-white">
                  نمایش{" "}
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}{" "}
                  تا{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    totalCount,
                  )}{" "}
                  از {totalCount} نتیجه
                </span>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage() || query.isFetching}
                  className="px-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4 text-blue-900 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300" />
                </button>

                <button
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage() || query.isFetching}
                  className="px-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-blue-900 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300" />
                </button>

                <span className="px-2 flex items-center space-x-1 font-medium text-block">
                  <span className="text-xs text-black dark:text-white">
                    صفحه
                  </span>
                  <strong className="text-xs dark:text-white">
                    {table.getState().pagination.pageIndex + 1} از{" "}
                    {table.getPageCount()}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage() || query.isFetching}
                  className="px-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-blue-900 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300" />
                </button>

                <button
                  type="button"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage() || query.isFetching}
                  className="px-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4 text-blue-900 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import {
    useReactTable,
    getCoreRowModel,
    // getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
} from "@tanstack/react-table";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo, useCallback, useState } from "react";
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
} from "lucide-react";
import FormButton from "./FormButton.tsx";

interface FilterField {
    field: string;
    label: string;
    placeholder?: string;
}

interface DataTableProps<T> {
    // Data and query configuration
    query: UseQueryResult<any, any>;

    // State management callbacks
    onSortingChange?: (sorting: any) => void;
    onPaginationChange: (pagination: any) => void;
    onFiltersChange: (filters: Array<{ key: string; value: string }>) => void;

    // Current state
    sorting?: any[];
    pagination: { pageIndex: number; pageSize: number };
    filters: Array<{ key: string; value: string }>;

    // Table configuration
    columns: ColumnDef<T, any>[];
    filterFields: FilterField[];

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
                                         // onSortingChange,
                                         onPaginationChange,
                                         onFiltersChange,
                                         // sorting,
                                         pagination,
                                         filters,
                                         columns,
                                         filterFields,
                                         emptyStateMessage = "هیچ داده‌ای یافت نشد",
                                         emptyStateDescription = "هنوز داده‌ای وجود ندارد.",
                                         loadingMessage,
                                         skeletonColumns = 5,
                                         className = "relative",
                                     }: DataTableProps<T>) {
    // Local state for filter inputs (for immediate UI updates)
    const currentData = (query.data as any)?.listResult || [];
    const totalCount = (query.data as any)?.total || 0;
    const totalPages = (query.data as any)?.totalPages || 1;

    const [localSorting, setLocalSorting] = useState<SortingState>([]);

    // const totalPages = Math.ceil(
    //   totalCount / pagination.pageSize
    // );

    const rowNumberColumn: ColumnDef<T, any> = {
        id: "rowNumber",
        header: "ردیف",
        cell: ({ row, table }) => {
            const { pageIndex, pageSize } = table.getState().pagination;
            return pageIndex * pageSize + row.index + 1;
        },
    };
    const allColumns = useMemo(() => [rowNumberColumn, ...columns], [columns]);
    const table = useReactTable({
        data: currentData,
        columns: allColumns,
        // state: {
        //   sorting: sorting ?? [],
        //   pagination,
        // },
        // onSortingChange: onSortingChange ?? (() => { }),

        state: {
            sorting: localSorting,
            pagination,
        },
        onSortingChange: setLocalSorting,
        onPaginationChange: onPaginationChange,

        getCoreRowModel: getCoreRowModel(),
        // getPaginationRowModel: getPaginationRowModel(), // It is only for client pagination
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        // manualSorting: true,
        pageCount: totalPages,
    });

    console.log('PAGINATION', {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        totalCount,
        totalPages,
    });

    const [selectedField, setSelectedField] = useState(
        filterFields.length ? filterFields[0].field : ""
    );
    const [searchValue, setSearchValue] = useState("");

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            setSearchValue(value);

            const newFilters = filters.filter((f) => f.key !== key);
            if (value.trim()) {
                newFilters.push({ key, value: value.trim() });
            }
            onFiltersChange(newFilters);
        },
        [filters, onFiltersChange]
    );

    // Show full loading skeleton only on initial load with no previous data
    if (query.isLoading && !query.data) {
        return <TableLoading rows={5} columns={skeletonColumns} />;
    }
    return (
        <div className={className}>
            {/* Subtle loading overlay for pagination/filter */}
            <TableLoadingOverlay
                isLoading={query.isFetching && !!query.data}
                message={loadingMessage}
            />

            {/* Filters - Only show if filterFields exist */}
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
                                        onChange={(e) => setSelectedField(e.target.value)}
                                    >
                                        {filterFields.map((opt) => (
                                            <option key={opt.field} value={opt.field}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute top-1.5 transform w-4 h-4 text-black pointer-events-none left-1 dark:text-white" />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <input
                                    id="filterValue"
                                    placeholder="جستجو"
                                    dir="rtl"
                                    className="bg-white rounded-lg text-sm px-3 py-1 outline-none dark:bg-slate-700 dark:placeholder-gray-400"
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => {
                                        setSearchValue(e.target.value);
                                        handleFilterChange(selectedField, e.target.value);
                                    }}
                                    name="filterValue"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <div className="relative">
                                <select
                                    className="bg-white rounded-lg text-sm pr-3 pl-8 py-1 appearance-none outline-none dark:bg-slate-700 dark:text-white"
                                    id="page-size"
                                    name="page-size"
                                    onChange={(e) =>
                                        onPaginationChange({
                                            ...pagination,
                                            pageSize: Number(e.target.value),
                                            pageIndex: 0,
                                        })
                                    }
                                >
                                    <option value="10" dir="rtl" className="text-right">
                                        10 ردیف
                                    </option>
                                    <option value="25" dir="rtl" className="text-right">
                                        25 ردیف
                                    </option>
                                    <option value="50" dir="rtl" className="text-right">
                                        50 ردیف
                                    </option>
                                    <option value="100" dir="rtl" className="text-right">
                                        100 ردیف
                                    </option>
                                </select>
                                <ChevronDown className="absolute top-1.5 transform w-4 h-4 text-black pointer-events-none left-1 dark:text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`bg-blue-100 dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-slate-900`}
            >
                {/* Table */}
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
                                        style={{ cursor: header.column.getCanSort() ? "pointer" : "default", WebkitTapHighlightColor: "transparent", }}
                                    >
                                        <div className="flex items-center space-x-1 space-x-reverse">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
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
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Error State */}
                {query.isError && !query.isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-slate-700">
                        <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400 mb-3" />
                        <p className="text-sm text-gray-700 dark:text-slate-300 mb-4">خطا در دریافت اطلاعات</p>
                        <FormButton title="تلاش مجدد" onClick={() => query.refetch()} />
                    </div>
                )}

                {/* Empty State */}
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

                {/* Pagination */}
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
                        totalCount
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

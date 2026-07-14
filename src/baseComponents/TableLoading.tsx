import { Loader2 } from "lucide-react";

interface TableLoadingProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export default function TableLoading({
                                         rows = 5,
                                         columns = 5,
                                         className = "relative",
                                     }: TableLoadingProps) {
    return (
        <div className={className}>
            <div className="mb-2 h-10 rounded-lg bg-gray-100 dark:bg-slate-700/50" />
            <div className="bg-white dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="px-3 py-3 text-right">
                                    <div className="h-3 bg-gray-200/80 dark:bg-slate-600 rounded w-3/4" />
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-600">
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td key={colIndex} className="px-4 py-3">
                                        <div
                                            className="h-3 bg-gray-100 dark:bg-slate-600/50 rounded animate-pulse"
                                            style={{ width: colIndex === 0 ? "2rem" : `${60 + (colIndex % 3) * 15}%` }}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="h-10 px-3 border-t border-gray-200 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-800/30" />
            </div>
        </div>
    );
}

interface TableLoadingOverlayProps {
    isLoading?: boolean;
    message?: string;
}

export function TableLoadingOverlay({
                                        isLoading = false,
                                        message,
                                    }: TableLoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
                {message && (
                    <span className="text-xs text-gray-600 dark:text-slate-400">{message}</span>
                )}
            </div>
        </div>
    );
}
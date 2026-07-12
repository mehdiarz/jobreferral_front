import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: (failureCount, error: any) => {
                    if (
                        error?.message?.includes("401") ||
                        error?.message?.includes("403")
                    ) {
                        return false;
                    }
                    return failureCount < 3;
                },
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: false,
            },
        },
    });

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(() => createQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

export const queryClient = createQueryClient();

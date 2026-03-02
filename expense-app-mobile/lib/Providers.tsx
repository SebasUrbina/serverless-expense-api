import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./AuthProvider";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
		},
	},
});

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</AuthProvider>
	);
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFedRate } from './hooks/useFedRate';
import { LineChart } from './components/charts/LineChart';
import { GridPanel } from './components/layout/GridPanel';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/layout/FilterBar';
import { EmploymentPanel } from './components/indicators/EmploymentPanel';
import { InflationPanel } from './components/indicators/InflationPanel';
import { CryptoPanel } from './components/indicators/CryptoPanel';
import { USIndicesPanel } from './components/indicators/USIndicesPanel';
import { useDashboardStore } from './stores/dashboardStore';
import { DARK_THEME } from './constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function FedRatePanel() {
  const timeRange = useDashboardStore((state) => state.timeRange);
  const { data, isLoading, error, dataUpdatedAt } = useFedRate(timeRange);

  return (
    <GridPanel
      title="美联储利率"
      isLoading={isLoading}
      lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : undefined}
    >
      {error && (
        <div className="p-2 bg-red-900/20 rounded text-red-400 mb-2">
          加载失败: {error.message}
        </div>
      )}
      {data && <LineChart data={data} timeRange={timeRange} />}
    </GridPanel>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="min-h-screen"
        style={{ backgroundColor: DARK_THEME.background }}
      >
        <Header />
        <main className="p-4">
          <div className="max-w-7xl mx-auto">
            {/* Filter Bar at top */}
            <FilterBar />

            {/* Grid layout for all panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                <FedRatePanel />
                <CryptoPanel />
                <USIndicesPanel />
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <EmploymentPanel />
                <InflationPanel />
              </div>
            </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/layout/Dashboard';
import { ExportDialog } from './components/ui/ExportDialog';
import { DARK_THEME } from './constants/colors';
import { useFedRate } from './hooks/useFedRate';
import { useCrypto } from './hooks/useCrypto';
import { useEmploymentSubMetrics } from './hooks/useEmploymentSubMetrics';
import { useInflationSubMetrics } from './hooks/useInflationSubMetrics';
import { usePCEData } from './hooks/usePCEData';
import { useChineseIndices } from './hooks/useChineseIndices';
import { usePBOCRate } from './hooks/usePBOCRate';
import { NormalizedIndicator } from './types/indicator';

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

function AppContent() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Gather available indicators for export dialog
  const fedRate = useFedRate();
  const crypto = useCrypto();
  const employment = useEmploymentSubMetrics();
  const inflation = useInflationSubMetrics();
  const pce = usePCEData();
  const chineseIndices = useChineseIndices();
  const pbocRate = usePBOCRate();

  // Combine all indicators for export
  const allIndicators: NormalizedIndicator[] = [
    fedRate.data ? [fedRate.data] : [],
    crypto.data || [],
    employment.data || [],
    inflation.data || [],
    pce.data || [],
    chineseIndices.data || [],
    pbocRate.data ? [pbocRate.data] : [],
  ].flat();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: DARK_THEME.background }}
    >
      <Header onExportClick={() => setExportDialogOpen(true)} />
      <Dashboard />

      {/* Export Dialog Modal */}
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        availableIndicators={allIndicators}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
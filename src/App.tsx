import { useState } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider, PersistedClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/layout/Dashboard';
import { ExportDialog } from './components/ui/ExportDialog';
import { DARK_THEME } from './constants/colors';
import { useFedRate } from './hooks/useFedRate';
import { useCrypto } from './hooks/useCrypto';
import { useInflationSubMetrics } from './hooks/useInflationSubMetrics';
import { usePCEData } from './hooks/usePCEData';
import { useChineseIndices } from './hooks/useChineseIndices';
import { usePBOCRate } from './hooks/usePBOCRate';
import { NormalizedIndicator } from './types/indicator';
import { serializeWithDates, deserializeWithDates } from './utils/queryPersister';

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

// 刷新秒出：query 缓存持久化到 localStorage，刷新先水合旧数据立即渲染，
// 再后台静默 refetch 更新（stale-while-revalidate）。maxAge 24h，隔天旧缓存不恢复。
const PERSIST_KEY = 'dashboard-query-cache';
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: PERSIST_KEY,
  serialize: serializeWithDates,
  deserialize: deserializeWithDates<PersistedClient>,
  throttleTime: 2000,
});

function AppContent() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const fedRate = useFedRate();
  const crypto = useCrypto();
  const inflation = useInflationSubMetrics();
  const pce = usePCEData();
  const chineseIndices = useChineseIndices();
  const pbocRate = usePBOCRate();

  const pbocIndicators = pbocRate.data ? [pbocRate.data.lpr, pbocRate.data.omo7d] : [];

  const allIndicators: NormalizedIndicator[] = [
    fedRate.data ? [fedRate.data] : [],
    crypto.data || [],
    inflation.data || [],
    pce.data || [],
    chineseIndices.data || [],
    pbocIndicators,
  ].flat();

  return (
    <div
      className="min-h-screen flex flex-col dell-frame max-w-[3360px] mx-auto md:my-6"
      style={{ backgroundColor: DARK_THEME.background }}
    >
      <Header onExportClick={() => setExportDialogOpen(true)} />
      <Dashboard />
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,  // 超过24h的旧缓存不恢复，直接走正常加载
        buster: 'v2',  // v2: Date 安全序列化格式，作废旧的裸 JSON 缓存
        dehydrateOptions: {
          // 只持久化成功加载过的 query，失败/加载中的不写入
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      <AppContent />
    </PersistQueryClientProvider>
  );
}

export default App;

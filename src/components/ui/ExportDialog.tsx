import { NormalizedIndicator } from '../../types/indicator';
import { useExportStore } from '../../stores/exportStore';
import { exportToCSV } from '../../utils/export-csv';
import { exportToExcel } from '../../utils/export-xlsx';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableIndicators: NormalizedIndicator[];
}

/**
 * Modal dialog for export with format selection, indicator picker, and data preview.
 * Per PITFALLS.md Pitfall 18, preview helps user verify data before export.
 */
export function ExportDialog({
  isOpen,
  onClose,
  availableIndicators,
}: ExportDialogProps) {
  const {
    selectedIndicatorIds,
    exportFormat,
    filename,
    toggleIndicator,
    setFormat,
    setFilename,
  } = useExportStore();

  // Filter selected indicators
  const selectedIndicators = availableIndicators.filter(
    (ind) => selectedIndicatorIds.includes(ind.id)
  );

  const handleExport = () => {
    // Sanitize filename (alphanumeric + underscore/hyphen only, Chinese allowed)
    // Per threat model T-02-14: prevent path traversal
    const sanitizedFilename = filename
      .replace(/[\/\\]/g, '_')
      .replace(/\.\./g, '')
      .replace(/[<>:"|?*]/g, '_');

    if (exportFormat === 'csv') {
      exportToCSV(selectedIndicators, sanitizedFilename);
    } else {
      exportToExcel(selectedIndicators, sanitizedFilename);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#161b22] rounded-lg p-6 w-[600px] max-h-[80vh]">
        <h2 className="text-[#c9d1d9] text-lg mb-4">数据导出</h2>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="text-[#8b949e] text-sm">导出格式:</label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={exportFormat === 'csv'}
                onChange={() => setFormat('csv')}
                className="accent-[#58a6ff]"
              />
              <span className="text-[#c9d1d9] ml-2">CSV</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={exportFormat === 'excel'}
                onChange={() => setFormat('excel')}
                className="accent-[#58a6ff]"
              />
              <span className="text-[#c9d1d9] ml-2">Excel</span>
            </label>
          </div>
        </div>

        {/* Filename Input */}
        <div className="mb-4">
          <label className="text-[#8b949e] text-sm">文件名:</label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="mt-2 w-full bg-[#0d1117] text-[#c9d1d9] border border-[#21262d] rounded px-3 py-2"
          />
        </div>

        {/* Indicator Selection */}
        <div className="mb-4">
          <label className="text-[#8b949e] text-sm">选择指标:</label>
          <div className="mt-2 grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
            {availableIndicators.map((ind) => (
              <label key={ind.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIndicatorIds.includes(ind.id)}
                  onChange={() => toggleIndicator(ind.id)}
                  className="accent-[#58a6ff]"
                />
                <span className="text-[#c9d1d9] ml-2 text-sm">{ind.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview Table */}
        {selectedIndicators.length > 0 && (
          <div className="mb-4 border border-[#21262d] rounded overflow-hidden">
            <div className="bg-[#0d1117] p-2 text-[#8b949e] text-sm">
              预览 ({selectedIndicators.length} 个指标)
            </div>
            <div className="max-h-[150px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0d1117] text-[#8b949e]">
                  <tr>
                    <th className="p-2">指标</th>
                    <th className="p-2">最新值</th>
                    <th className="p-2">单位</th>
                  </tr>
                </thead>
                <tbody className="text-[#c9d1d9]">
                  {selectedIndicators.map((ind) => (
                    <tr key={ind.id} className="border-t border-[#21262d]">
                      <td className="p-2">{ind.name}</td>
                      <td className="p-2">{ind.value.toFixed(2)}</td>
                      <td className="p-2">{ind.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#21262d] text-[#8b949e] rounded hover:bg-[#30363d]"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIndicators.length === 0}
            className="px-4 py-2 bg-[#3fb950] text-[#0d1117] rounded disabled:opacity-50 hover:bg-[#3fb950]/80"
          >
            导出
          </button>
        </div>
      </div>
    </div>
  );
}
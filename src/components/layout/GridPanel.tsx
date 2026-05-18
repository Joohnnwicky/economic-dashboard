import { ReactNode } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { LastUpdated } from '../ui/LastUpdated';
import { DARK_THEME } from '../../constants/colors';

interface GridPanelProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  lastUpdated?: Date;
}

export function GridPanel({ title, children, isLoading, lastUpdated }: GridPanelProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: DARK_THEME.panel }}
    >
      <h3
        className="text-lg font-medium mb-4"
        style={{ color: DARK_THEME.text }}
      >
        {title}
      </h3>

      <ErrorBoundary>
        {isLoading ? <LoadingSpinner /> : children}
      </ErrorBoundary>

      {lastUpdated && (
        <div className="mt-2">
          <LastUpdated timestamp={lastUpdated} />
        </div>
      )}
    </div>
  );
}
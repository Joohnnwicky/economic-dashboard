import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface LastUpdatedProps {
  timestamp: Date;
  isStale?: boolean;
}

export function LastUpdated({ timestamp, isStale = false }: LastUpdatedProps) {
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true, locale: zhCN });

  return (
    <div className={`text-sm ${isStale ? 'text-yellow-500' : 'text-gray-500'}`}>
      更新于 {timeAgo}
      {isStale && <span className="ml-2">(数据可能过期)</span>}
    </div>
  );
}
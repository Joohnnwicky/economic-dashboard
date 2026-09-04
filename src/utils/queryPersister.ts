/**
 * react-query localStorage 持久化的 Date 安全序列化。
 *
 * 缓存里的数据带有 Date 对象（如 PBOC 等 hook 把 timestamp 转成 Date）。
 * 注意不能用 JSON.stringify 的 replacer 处理 Date：replacer 收到的是
 * toJSON() 之后的 ISO 字符串，instanceof Date 永远不命中。这里在
 * stringify 之前手动递归替换为 {$date: ISO} 标记，反序列化时还原。
 * （数据中不存在合法的 "$date" 字段，不会误伤）
 */

const DATE_MARKER = '$date';

function replaceDates(value: unknown): unknown {
  if (value instanceof Date) {
    return { [DATE_MARKER]: value.toISOString() };
  }
  if (Array.isArray(value)) {
    return value.map(replaceDates);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out[key] = replaceDates((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function serializeWithDates(client: unknown): string {
  return JSON.stringify(replaceDates(client));
}

export function deserializeWithDates<T = unknown>(persisted: string): T {
  return JSON.parse(persisted, (_key, value: unknown) => {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      DATE_MARKER in (value as Record<string, unknown>) &&
      typeof (value as Record<string, unknown>)[DATE_MARKER] === 'string' &&
      Object.keys(value as Record<string, unknown>).length === 1
    ) {
      return new Date((value as Record<string, string>)[DATE_MARKER]);
    }
    return value;
  }) as T;
}

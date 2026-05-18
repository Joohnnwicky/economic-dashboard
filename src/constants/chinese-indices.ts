// East Money index codes for A-share indices
// Format: {exchange_prefix}.{index_code}
// Exchange prefixes: 1 = Shanghai, 0 = Shenzhen

export const CHINESE_INDEX_CODES = {
  SSE_COMPOSITE: '1.000001',     // 上证指数 (Shanghai Composite Index)
  SZSE_COMPONENT: '0.399001',    // 深证成指 (Shenzhen Component Index)
  CHINEXT: '0.399006',           // 创业板指 (ChiNext Index)
} as const;

// East Money field codes (discovered by community reverse-engineering)
// f2 = latest price (最新价)
// f3 = change percentage (涨跌幅)
// f4 = change amount (涨跌额)
// f12 = code (代码)
// f14 = name (名称)
// f15 = high (最高)
// f16 = low (最低)
// f17 = open (今开)
// f18 = previous close (昨收)

export const EASTMONEY_INDEX_FIELDS = 'f2,f3,f4,f12,f14,f15,f16,f17,f18' as const;
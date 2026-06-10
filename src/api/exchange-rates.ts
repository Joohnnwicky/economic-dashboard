import axios from 'axios';
import { NormalizedIndicator, HistoricalDataPoint } from '../types/indicator';
import { subYears, format } from 'date-fns';

const FRANKFURTER_BASE_URL = '/api/backend/frankfurter';

interface FrankfurterV2RateItem {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export async function getLatestExchangeRates(): Promise<{
  EUR: number;
  GBP: number;
  JPY: number;
  CNY: number;
  timestamp: Date;
}> {
  const url = `${FRANKFURTER_BASE_URL}/v2/rates?base=USD&quotes=EUR,GBP,JPY,CNY`;
  const response = await axios.get<FrankfurterV2RateItem[]>(url);

  if (!Array.isArray(response.data)) {
    throw new Error('Frankfurter response missing rates');
  }

  const ratesMap: Record<string, number> = {};
  for (const item of response.data) {
    ratesMap[item.quote] = item.rate;
  }

  return {
    EUR: ratesMap.EUR || 0,
    GBP: ratesMap.GBP || 0,
    JPY: ratesMap.JPY || 0,
    CNY: ratesMap.CNY || 0,
    timestamp: new Date(),
  };
}

export async function getHistoricalExchangeRate(
  toCurrency: string,
): Promise<NormalizedIndicator> {
  const now = new Date();
  const startDate = format(subYears(now, 1), 'yyyy-MM-dd');
  const endDate = format(now, 'yyyy-MM-dd');

  const url = `${FRANKFURTER_BASE_URL}/v2/rates?from=${startDate}&to=${endDate}&base=USD&quotes=${toCurrency}`;
  const response = await axios.get<FrankfurterV2RateItem[]>(url);

  if (!Array.isArray(response.data)) {
    throw new Error(`Frankfurter historical response missing rates for ${toCurrency}`);
  }

  const historical: HistoricalDataPoint[] = response.data
    .map((item) => ({
      timestamp: new Date(item.date + 'T00:00:00Z'),
      value: item.rate,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const current = historical[historical.length - 1];
  const previous = historical[historical.length - 2];

  let change: NormalizedIndicator['change'] = undefined;
  if (current && previous && previous.value != null && current.value != null && previous.value > 0) {
    const changeValue = current.value - previous.value;
    const changePct = (changeValue / previous.value) * 100;
    change = {
      value: changeValue,
      percentage: changePct,
      period: 'daily' as const,
    };
  }

  const currencyNames: Record<string, string> = {
    EUR: '美元/欧元（USD/EUR）',
    GBP: '美元/英镑（USD/GBP）',
    JPY: '美元/日元（USD/JPY）',
    CNY: '美元/人民币（USD/CNY）',
  };

  if (historical.length > 365) {
    historical.splice(0, historical.length - 365);
  }

  return {
    id: `usd-${toCurrency.toLowerCase()}`,
    name: currencyNames[toCurrency] || `USD/${toCurrency}`,
    value: current?.value ?? 0,
    unit: toCurrency,
    timestamp: current?.timestamp ?? new Date(),
    change,
    historical,
  };
}

export async function getAllExchangeRates(): Promise<{
  EUR: NormalizedIndicator;
  GBP: NormalizedIndicator;
  JPY: NormalizedIndicator;
}> {
  const [eur, gbp, jpy] = await Promise.all([
    getHistoricalExchangeRate('EUR'),
    getHistoricalExchangeRate('GBP'),
    getHistoricalExchangeRate('JPY'),
  ]);

  return { EUR: eur, GBP: gbp, JPY: jpy };
}

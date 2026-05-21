import axios from 'axios';

interface CityPrice {
  rank: number;
  city: string;
  province: string;
  price: number;
  change: number | null;
  unit: string;
}

interface DistrictPrice {
  name: string;
  price: number;
  change: number | null;
}

interface CityDetail {
  cityCode: string;
  cityName: string;
  secondHandPrice: number | null;
  secondHandChange: number | null;
  newPrice: number | null;
  newChange: number | null;
  districts: DistrictPrice[];
  dataMonth: string | null;
  unit: string;
  error?: string;
}

interface HousingPriceResponse {
  national: CityPrice[];
  cities: Record<string, CityDetail>;
  updateTime: string;
}

/**
 * Fetch housing price data from Python backend
 */
export async function getHousingPrices(): Promise<HousingPriceResponse> {
  const response = await axios.get<HousingPriceResponse>('/api/backend/housing-prices');
  return response.data;
}

/**
 * Fetch single city housing price
 */
export async function getCityHousingPrice(cityCode: string): Promise<CityDetail> {
  const response = await axios.get<CityDetail>(`/api/backend/housing-prices/city/${cityCode}`);
  return response.data;
}

/**
 * Refresh housing price cache (manual)
 */
export async function refreshHousingPrices(): Promise<{ message: string; updateTime: string; cityCount: number }> {
  const response = await axios.post('/api/backend/housing-prices/refresh');
  return response.data;
}
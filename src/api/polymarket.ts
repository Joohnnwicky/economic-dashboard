import axios from 'axios';

const POLYMARKET_GAMMA_URL = 'https://gamma-api.polymarket.com';

interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string;  // JSON string like '["Yes", "No"]'
  outcomePrices: string;  // JSON string like '["0.54", "0.46"]'
  volume: string;
  volumeNum: number;
  volume24hr: number;
  active: boolean;
  closed: boolean;
  acceptingOrders: boolean;
  endDate: string;
  events?: Array<{
    title: string;
    slug: string;
    image: string;
  }>;
}

export interface FormattedMarket {
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  url: string;
  image?: string;
  eventTitle?: string;
}

/**
 * Get trending markets from Polymarket Gamma API
 * Sorted by 24hr volume to get truly popular markets
 */
export async function getTrendingMarkets(limit: number = 10): Promise<GammaMarket[]> {
  const url = `${POLYMARKET_GAMMA_URL}/markets`;

  const response = await axios.get<GammaMarket[]>(url, {
    params: {
      limit: 100,
      closed: 'false',
      active: 'true',
    },
  });

  if (!response.data?.length) {
    return [];
  }

  // Sports keywords to filter out
  const sportsKeywords = [
    'NBA', 'FIFA', 'World Cup', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF',
    'soccer', 'football', 'basketball', 'tennis', 'golf', 'boxing', 'UFC', 'MMA',
    'Olympics', 'World Series', 'Super Bowl', 'Premier League', 'La Liga',
    'Cavaliers', 'Knicks', 'Lakers', 'Celtics', 'Warriors', 'Heat', 'Mavericks',
    'win the 2026', 'beat the', 'vs.', 'matchup', 'game', 'season',
  ];

  // Filter: truly active + non-sports + has question
  const markets = response.data
    .filter(m => {
      if (m.closed !== false || m.acceptingOrders !== true || !m.question) return false;
      // Exclude sports markets
      const questionLower = m.question.toLowerCase();
      const eventTitleLower = (m.events?.[0]?.title || '').toLowerCase();
      return !sportsKeywords.some(kw =>
        questionLower.includes(kw.toLowerCase()) || eventTitleLower.includes(kw.toLowerCase())
      );
    })
    .sort((a, b) => (b.volume24hr || 0) - (a.volume24hr || 0))
    .slice(0, limit);

  return markets;
}

/**
 * Format Polymarket data for display
 */
export function formatMarketData(market: GammaMarket): FormattedMarket {
  // Parse outcome prices from JSON string
  let yesPrice = 50;
  let noPrice = 50;

  try {
    const prices = JSON.parse(market.outcomePrices || '["0.5", "0.5"]');
    yesPrice = parseFloat(prices[0]) * 100;
    noPrice = parseFloat(prices[1]) * 100;
  } catch {
    // Use defaults if parsing fails
  }

  // Truncate long questions
  const question = market.question || 'Unknown Market';
  const shortQuestion = question.length > 80 ? question.substring(0, 77) + '...' : question;

  // Format volume
  const volumeNum = parseFloat(market.volume) || 0;
  const volume = volumeNum >= 1000000
    ? `$${(volumeNum / 1000000).toFixed(1)}M`
    : volumeNum >= 1000
    ? `$${(volumeNum / 1000).toFixed(1)}K`
    : `$${volumeNum.toFixed(0)}`;

  const event = market.events?.[0];

  return {
    question: shortQuestion,
    yesPrice,
    noPrice,
    volume,
    url: `https://polymarket.com/event/${event?.slug || market.slug}`,
    image: event?.image,
    eventTitle: event?.title,
  };
}
import axios from 'axios';

// 通过后端代理（与其他外部API一致）
const POLYMARKET_GAMMA_URL = '/api/backend/polymarket';

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

  // US Politics keywords to filter out
  const politicsKeywords = [
    'Democratic', 'Republican', 'president', 'presidential', 'nomination',
    'election', 'Senate', 'House', 'Congress', 'governor', 'mayor',
    'Trump', 'Biden', 'Obama', 'Clinton', 'Hillary', 'Whitmer', 'Cheney',
    'Mamdani', 'Murphy', 'primary', 'poll', 'vote', 'campaign',
    '2028', '2024', 'Dem', 'GOP',
  ];

  // China Politics keywords to filter out (合规风险)
  const chinaPoliticsKeywords = [
    'China', 'Chinese', 'China\'s', 'Beijing', 'Shanghai', 'Xi', 'Xi Jinping',
    'CCP', 'CPC', 'Communist Party', '中国', '习近平', '中共', '共产党',
    'Taiwan', '台湾', 'Hong Kong', '香港', 'Macau', '澳门',
    'Xinjiang', '新疆', 'Tibet', '西藏', 'Dalai', '达赖',
    'Uyghur', '维吾尔', 'Human Rights', '人权', 'censorship', '审查',
    'TikTok', 'Douyin', '抖音', 'Huawei', '华为', 'Binance', '币安',
    'Alibaba', '阿里巴巴', 'Tencent', '腾讯', 'WeChat', '微信',
    'sanction', '制裁', 'tariff', '关税', 'trade war', '贸易战',
    'South China Sea', '南海', 'dispute', '争端', 'claim', '主权',
    'reunification', '统一', 'invasion', '入侵', 'military', '军事',
    'regime', '政权', 'authoritarian', '专制', 'democracy', '民主',
  ];

  // Filter: truly active + non-sports + non-politics + non-china-politics + has question
  const markets = response.data
    .filter(m => {
      if (m.closed !== false || m.acceptingOrders !== true || !m.question) return false;
      // Exclude sports and politics markets
      const questionLower = m.question.toLowerCase();
      const eventTitleLower = (m.events?.[0]?.title || '').toLowerCase();
      const isSports = sportsKeywords.some(kw =>
        questionLower.includes(kw.toLowerCase()) || eventTitleLower.includes(kw.toLowerCase())
      );
      const isPolitics = politicsKeywords.some(kw =>
        questionLower.includes(kw.toLowerCase()) || eventTitleLower.includes(kw.toLowerCase())
      );
      const isChinaPolitics = chinaPoliticsKeywords.some(kw =>
        questionLower.includes(kw.toLowerCase()) || eventTitleLower.includes(kw.toLowerCase())
      );
      return !isSports && !isPolitics && !isChinaPolitics;
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
// 美债抛售因果链数据 - 新建（2026-08 美债抛售事件叙事链）
//
// 语义：driver=抛售诱因（五大结构性压力）；macro=事件传导链路；asset=最终矛盾结论。
// 边极性统一 +1（事件沿因果链正向触发传递）；net>0 表示该环节已被触发。
// 该图为已发生的历史叙事链，默认全部驱动激活，打开即点亮完整链路。
import { CausalGraph } from '../../types/causal';

export const TREASURY_SELLOFF_GRAPH: CausalGraph = {
  nodes: [
    // ===== 抛售诱因（驱动层） =====
    { id: 'fiscal_hole',   label: '财政黑洞', group: 'driver', note: '债务破40万亿，赤字2.1万亿占GDP 6.4%' },
    { id: 'geo_conflict',  label: '地缘冲突', group: 'driver', note: '中东僵持油价暴涨，通胀焦虑重燃' },
    { id: 'ai_money_grab', label: 'AI抢钱', group: 'driver', note: '科技巨头疯狂发债，与政府争夺长期资本' },
    { id: 'policy_fog',    label: '政策迷雾', group: 'driver', note: '美联储新主席立场不明，市场对联储失望' },
    { id: 'global_exit',   label: '全球撤退', group: 'driver', note: '海外减持1900亿，日英法等多国抛售' },

    // ===== 事件传导链路 =====
    { id: 'selloff',    label: '美债遭大规模抛售\n30年期收益率飙至5.34%\n创2007年以来新高', group: 'macro', note: '五大压力共振，长端利率失控' },
    { id: 'bessent',    label: '贝森特行动\n8月19日宣布回购翻倍\n单次上限从20亿升至至少40亿', group: 'macro', note: '财政部亲自下场托底长端' },
    { id: 'mkt_react',  label: '短期市场反应', group: 'macro', note: '回购翻倍公布后的即时行情' },
    { id: 'yield_down', label: '30年期收益率\n跌至5.19%', group: 'macro', note: '回购公告当日' },
    { id: 'stock_bounce', label: '美股反弹', group: 'macro', note: '回购公告当日' },
    { id: 'one_day',    label: '效果仅维持一天\n次日收益率再度回升', group: 'macro', note: '单次回购不足以扭转结构性抛压' },
    { id: 'bessent_reply', label: '贝森特回应\n称逆转是噪音\n暗示回购可能超过40亿\n强调工具箱很大', group: 'macro', note: '官方口径：继续加码' },

    // ===== 华尔街解读分支 =====
    { id: 'street_reads', label: '华尔街三种解读', group: 'macro', note: '对财政部干预意图的分歧' },
    { id: 'stealth_ot',   label: '变相OT\n财政部直接压低长端利率', group: 'macro', note: '解读一：类收益率曲线控制' },
    { id: 'pandora',      label: '潘多拉魔盒\n干预或迫使美联储激进加息', group: 'macro', note: '解读二：财政主导引发通胀反噬' },
    { id: 'hf_sweep',     label: '对冲基金式扫盘\n强势干预全面压制收益率', group: 'macro', note: '解读三：以交易手段震慑空头' },

    // ===== 根本矛盾（结论层） =====
    { id: 'root',     label: '根本矛盾', group: 'macro', note: '三种解读殊途同归' },
    { id: 'symptom',  label: '治标不治本\n赤字通胀债务规模未变', group: 'asset', note: '回购不改财政基本面' },
    { id: 'unorthodox', label: '背离传统\n打破常规可预期原则', group: 'asset', note: '财政部角色越界，市场定价锚动摇' },
    { id: 'chain_intervene', label: '连环干预\n7月曾联合日本买入日元', group: 'asset', note: '汇率+利率干预常态化' },
  ],

  edges: [
    // 极性统一 +1：诱因触发事件，事件沿因果链正向传递
    // --- 五大诱因 -> 美债抛售 ---
    { source: 'fiscal_hole',   target: 'selloff', polarity: 1, note: '债务与赤字压力' },
    { source: 'geo_conflict',  target: 'selloff', polarity: 1, note: '油价推升通胀焦虑' },
    { source: 'ai_money_grab', target: 'selloff', polarity: 1, note: '争夺长期资本推高期限溢价' },
    { source: 'policy_fog',    target: 'selloff', polarity: 1, note: '对联储不信任' },
    { source: 'global_exit',   target: 'selloff', polarity: 1, note: '海外央行与机构减持' },

    // --- 抛售 -> 财政部行动 -> 短期反应 -> 效果衰减 -> 回应 ---
    { source: 'selloff',    target: 'bessent',   polarity: 1, note: '收益率失控触发干预' },
    { source: 'bessent',    target: 'mkt_react', polarity: 1, note: '公告即行情' },
    { source: 'mkt_react',  target: 'yield_down',   polarity: 1, note: '长端回落15bp' },
    { source: 'mkt_react',  target: 'stock_bounce', polarity: 1, note: '流动性担忧缓解' },
    { source: 'yield_down',   target: 'one_day', polarity: 1, note: '反弹次日逆转' },
    { source: 'stock_bounce', target: 'one_day', polarity: 1, note: '反弹次日逆转' },
    { source: 'one_day',    target: 'bessent_reply', polarity: 1, note: '官方回应质疑' },

    // --- 行动 -> 华尔街三种解读 -> 根本矛盾 ---
    { source: 'bessent',      target: 'street_reads', polarity: 1, note: '干预意图引发分歧' },
    { source: 'street_reads', target: 'stealth_ot', polarity: 1, note: '解读一' },
    { source: 'street_reads', target: 'pandora',    polarity: 1, note: '解读二' },
    { source: 'street_reads', target: 'hf_sweep',   polarity: 1, note: '解读三' },
    { source: 'stealth_ot', target: 'root', polarity: 1, note: '殊途同归' },
    { source: 'pandora',    target: 'root', polarity: 1, note: '殊途同归' },
    { source: 'hf_sweep',   target: 'root', polarity: 1, note: '殊途同归' },

    // --- 根本矛盾 -> 三大批评 ---
    { source: 'root', target: 'symptom',        polarity: 1, note: '基本面未变' },
    { source: 'root', target: 'unorthodox',     polarity: 1, note: '打破规则预期' },
    { source: 'root', target: 'chain_intervene', polarity: 1, note: '干预常态化' },
  ],
};

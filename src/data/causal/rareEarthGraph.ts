// 稀土产业链流向图数据（拓展版）- 从 worldeco/rareearth-graph.js 移植
// 扩展：加节点/边只需在此追加，算法与渲染自动适配。
//
// 语义：driver=可断供矿产（含稀土与同管制关键金属）；macro=提纯/工艺/中间品/组件；asset=终端产业。
// 边极性统一 +1（断供冲击沿链下游传递，不翻转）；net>0 表示受断供冲击。
// 矿产 subgroup：light=轻稀土(铈族), heavy=重稀土(钇族), metal=关键金属(非稀土但同步管制), gas=战略气体(惰性/工业气体)。
// 说明：氦气等战略气体既非稀土也非金属，但与稀土同属出口管制战略物资，并列于本图。
import { CausalGraph } from '../../types/causal';

export const RARE_EARTH_GRAPH: CausalGraph = {
  nodes: [
    // ===== 矿产层（断供开关） =====
    // 轻稀土（铈族）
    { id: 'la', label: '镧', group: 'driver', subgroup: 'light', note: '储氢合金(LaNi5)与光学玻璃核心；丰田THS混动镍氢电池负极；2026年随稀土管制收紧' },
    { id: 'ce', label: '铈', group: 'driver', subgroup: 'light', note: '储量最大、最便宜的稀土；二氧化铈抛光粉(CMP)+汽车尾气三效催化剂；半导体晶圆抛光关键耗材' },
    { id: 'pr', label: '镨', group: 'driver', subgroup: 'light', note: '与钕共生(PrNd合金)，钕铁硼磁体添加镨改善性能与成本' },
    { id: 'nd', label: '钕', group: 'driver', subgroup: 'light', note: '钕铁硼(NdFeB)永磁体核心元素，目前最强永磁材料；EV驱动电机/风电直驱/机器人关节/硬盘主轴均依赖' },
    { id: 'sm', label: '钐', group: 'driver', subgroup: 'light', note: '钐钴(SmCo)磁体原料；耐250-350℃高温、抗腐蚀、温度稳定性极佳；航天/军工/高温传感器不可替代' },
    { id: 'eu', label: '铕', group: 'driver', subgroup: 'light', note: '红色荧光粉(Eu³⁺)唯一实用来源；显示与LED照明不可替代，量少但卡脖子' },
    // 重稀土（钇族）
    { id: 'gd', label: '钆', group: 'driver', subgroup: 'heavy', note: 'MRI造影剂最大医用用途；磁光材料(光隔离器)；中子屏蔽(核反应堆)；100%依赖中国进口' },
    { id: 'tb', label: '铽', group: 'driver', subgroup: 'heavy', note: '钕铁硼磁体耐高温添加剂+磁光材料(光隔离器)；1月起对日出口为零' },
    { id: 'dy', label: '镝', group: 'driver', subgroup: 'heavy', note: '钕铁硼磁体耐高温添加剂(提高矫顽力)，EV牵引电机/高温工况必需；1月起对日出口为零' },
    { id: 'y',  label: '钇', group: 'driver', subgroup: 'heavy', note: 'YAG激光晶体+氧化锆稳定剂+超导；氧化钇全球93%+产能集中在中国；1月起出口为零' },
    { id: 'er', label: '铒', group: 'driver', subgroup: 'heavy', note: '掺铒光纤放大器(EDFA)，1550nm波段光纤通信骨干网放大器；互联网骨干核心，不可替代' },
    { id: 'sc', label: '钪', group: 'driver', subgroup: 'heavy', note: '铝钪合金高强度耐焊；航空航天、导弹结构件；固体氧化物燃料电池电解质' },
    // 关键金属（非稀土但同步管制）
    { id: 'w',  label: '钨', group: 'driver', subgroup: 'metal', note: '关键金属(非稀土)；六氟化钨(CVD钨金属化)+碳化钨硬质合金；2月起对日出口归零' },
    { id: 'sb', label: '锑', group: 'driver', subgroup: 'metal', note: '关键金属(非稀土)；含锑铅弹药硬化+阻燃剂+铅酸电池；用于弹药及汽车零部件' },
    // 战略气体（惰性/工业气体，非稀土非金属，同属出口管制）
    { id: 'he', label: '氦气', group: 'driver', subgroup: 'gas', note: '战略气体(非稀土非金属)；半导体保护气/光纤制造/MRI液氦冷却/火箭加压吹扫/雷达传感器；2026/7/10商务部公告暂停出口。注：中国自身85%+氦气靠进口(卡塔尔/俄罗斯/美国)，国产仅5-15%，俄奥伦堡氦厂6/24被袭后全球供给收紧' },

    // ===== 提纯/工艺/中间产品层 =====
    // 钨链
    { id: 'hpw', label: '高纯钨粉', group: 'macro', note: '六氟化钨需高纯度钨粉，中国独家提纯能力；日本国内几乎无钨矿，此前90%+从中国进口' },
    { id: 'wf6', label: '六氟化钨', group: 'macro', note: '关东化成/中央硝子为全球两大供应商(合计约25%高端产能)；2026/7/1正式停产，年产约2000吨刚性缺口' },
    // 钇链
    { id: 'y2o3', label: '氧化钇', group: 'macro', note: '氧化锆稳定剂；全球93%+产能集中在中国' },
    { id: 'zro2', label: '氧化锆', group: 'macro', note: '东曹为全球顶级供应商，库存耗尽后暂停供货' },
    { id: 'yag', label: 'YAG激光晶体', group: 'macro', note: '钇铝石榴石，Nd:YAG激光器核心晶体；工业加工/医疗/军事激光' },
    { id: 'laser', label: '激光器', group: 'macro', note: 'YAG激光器；激光加工、医疗、半导体光刻/退火' },
    // 磁体链
    { id: 'magnet', label: '钕铁硼磁体', group: 'macro', note: '最强永磁体；Nd/Pr为主，Dy/Tb添加提高矫顽力；5月磁体出口量连续3月低于200吨' },
    { id: 'smco', label: '钐钴磁体', group: 'macro', note: '耐高温抗腐蚀永磁体；航天/军工/高温电机；SmCo5/Sm2Co17' },
    { id: 'wind_gen', label: '风电发电机', group: 'macro', note: '直驱永磁风力发电机，单台用钕铁硼约1吨级' },
    { id: 'industrial_motor', label: '工业电机', group: 'macro', note: '高效永磁电机；工业机器人关节、数控机床、伺服系统' },
    // 光通信链
    { id: 'isolator', label: '光隔离器', group: 'macro', note: 'Gramerot生产，磁光材料；1月断供后无力接新单' },
    { id: 'edfa', label: 'EDFA放大器', group: 'macro', note: '掺铒光纤放大器；光纤通信骨干网中继放大，不可替代' },
    // 铈链
    { id: 'ceo2', label: '二氧化铈', group: 'macro', note: '铈基抛光粉；CMP化学机械抛光，半导体晶圆/精密光学抛光' },
    { id: 'wafer_polish', label: '晶圆CMP抛光', group: 'macro', note: '半导体晶圆平坦化关键工序，决定芯片制程良率' },
    { id: 'ceria_catalyst', label: '铈基催化剂', group: 'macro', note: '三效催化储氧材料；汽车尾气净化' },
    { id: 'exhaust', label: '尾气净化器', group: 'macro', note: '汽车排气后处理；铈基催化+铈锆固溶体' },
    // 镧链
    { id: 'hydride', label: '储氢合金', group: 'macro', note: 'LaNi5型储氢合金；镍氢电池负极' },
    { id: 'nimh', label: '镍氢电池', group: 'macro', note: '丰田THS混动系统(普锐斯等)动力电池；成本低于锂电但能量密度低' },
    { id: 'optical_glass', label: '光学玻璃', group: 'macro', note: '高折射低色散；镜头/望远镜/内窥镜' },
    { id: 'lens', label: '光学镜头', group: 'macro', note: '相机/医疗内窥镜/激光聚焦镜组' },
    // 铕链
    { id: 'red_phosphor', label: '红色荧光粉', group: 'macro', note: 'Eu³⁺红色荧光粉；显示三基色与白光LED，红色通道不可替代' },
    // 钪链
    { id: 'alsc', label: '铝钪合金', group: 'macro', note: '钪微合金化铝；强度高、耐焊、抗疲劳；航空航天与导弹结构件' },
    // 锑链
    { id: 'sb_lead', label: '含锑铅', group: 'macro', note: '锑硬化铅；弹药破甲、铅酸电池板栅' },
    // 钆链
    { id: 'mri_contrast', label: 'MRI造影剂', group: 'macro', note: '钆螯合物；磁共振成像增强对比剂，钆最大医用用途' },
    // 氦气链
    { id: 'fiber', label: '光纤', group: 'macro', note: '光纤预制棒拉丝需氦气作保护气；光通信物理介质' },
    { id: 'mri_cooling', label: 'MRI液氦冷却', group: 'macro', note: '超导磁体需液氦维持4K低温；与钆造影剂为MRI两个独立关键输入' },
    { id: 'rocket_press', label: '火箭加压吹扫', group: 'macro', note: '氦气作推进剂贮箱加压与管路吹扫；火箭测试必需' },
    { id: 'radar_sensor', label: '雷达/传感器', group: 'macro', note: '军用雷达与传感器制造需氦气；光纤控制FPV无人机亦涉及' },

    // ===== 组件层 =====
    { id: 'hbm', label: 'HBM内存', group: 'macro', note: '没有六氟化钨就没有HBM高带宽内存；SK海力士/台积电/镁光均受影响' },
    { id: 'mlcc', label: 'MLCC电容', group: 'macro', note: '高端MLCC核心原料为氧化锆；AI服务器关键零件' },
    { id: 'opt_module', label: '高速光模块', group: 'macro', note: '800G/1.6T光模块离不开光隔离器' },
    { id: 'ev_motor', label: 'EV驱动电机', group: 'macro', note: '稀土永磁电机为主流方案；铃木5月停产主力车型' },
    { id: 'missile_part', label: '导弹部件', group: 'macro', note: '碳化钨穿甲/导弹结构件' },

    // ===== 终端产业层 =====
    { id: 'ai_gpu', label: 'AI硬件/GPU', group: 'asset', note: '没有HBM，GPU是一堆废铜烂铁' },
    { id: 'ai_server', label: 'AI服务器', group: 'asset', note: 'MLCC是AI服务器关键零件' },
    { id: 'opt_comms', label: '光通信', group: 'asset', note: '光模块+EDFA支撑AI光通信与互联网骨干' },
    { id: 'auto', label: '汽车产业', group: 'asset', note: '占日本工业总产值40%、GDP 8%；EV电机+镍氢混动+尾气催化多链交汇' },
    { id: 'defense', label: '军工/弹药', group: 'asset', note: '弹药/导弹部件+钐钴高温磁体；军工自主化受阻' },
    { id: 'wind_power', label: '风电', group: 'asset', note: '直驱永磁风机依赖钕铁硼；海上风电单机用量大' },
    { id: 'robotics', label: '工业机器人', group: 'asset', note: '伺服电机+关节永磁电机；自动化产线核心' },
    { id: 'semiconductor_mfg', label: '半导体制造', group: 'asset', note: 'CMP抛光+钨金属化+激光光刻；晶圆制造多环节受制' },
    { id: 'display', label: '显示面板', group: 'asset', note: '红色荧光粉不可替代；LCD/OLED色彩' },
    { id: 'aerospace', label: '航空航天', group: 'asset', note: '铝钪合金+钐钴高温磁体；航天器与导弹结构' },
    { id: 'medical', label: '医疗影像', group: 'asset', note: 'MRI造影剂+YAG激光医疗+光学内窥镜' },
  ],

  edges: [
    // 极性统一 +1：断供沿产业链向下游传递，net>0 即受冲击
    // --- 钨链（钨 -> 高纯钨粉 -> 六氟化钨 -> HBM -> AI硬件） ---
    { source: 'w',   target: 'hpw',         polarity: 1, note: '高纯钨粉提纯，中国独家能力' },
    { source: 'hpw', target: 'wf6',         polarity: 1, note: '六氟化钨需高纯钨粉' },
    { source: 'wf6', target: 'hbm',         polarity: 1, note: '没有六氟化钨就没有HBM' },
    { source: 'hbm', target: 'ai_gpu',      polarity: 1, note: '没有HBM，GPU是废铜烂铁' },
    { source: 'w',   target: 'missile_part',polarity: 1, note: '碳化钨/钨粉用于导弹部件' },
    { source: 'missile_part', target: 'defense', polarity: 1, note: '导弹部件->军工' },

    // --- 钇链（钇 -> 氧化钇 -> 氧化锆 -> MLCC -> AI服务器；钇 -> YAG -> 激光） ---
    { source: 'y',   target: 'y2o3',        polarity: 1, note: '氧化钇提纯，93%+产能在中国' },
    { source: 'y2o3',target: 'zro2',        polarity: 1, note: '氧化钇作氧化锆稳定剂' },
    { source: 'zro2',target: 'mlcc',        polarity: 1, note: '氧化锆->高端MLCC核心原料' },
    { source: 'mlcc',target: 'ai_server',   polarity: 1, note: 'MLCC是AI服务器关键零件' },
    { source: 'y',   target: 'yag',         polarity: 1, note: 'YAG激光晶体以钇铝石榴石为基' },
    { source: 'yag', target: 'laser',       polarity: 1, note: 'Nd:YAG激光器核心晶体' },
    { source: 'laser', target: 'medical',   polarity: 1, note: 'YAG激光医疗(手术/碎石)' },
    { source: 'laser', target: 'semiconductor_mfg', polarity: 1, note: '激光退火/光刻/晶圆标记' },

    // --- 钕铁硼磁体链（钕/镨/镝/铽 -> 钕铁硼 -> EV电机/风电/工业电机） ---
    { source: 'nd',  target: 'magnet',      polarity: 1, note: '钕铁硼主元素' },
    { source: 'pr',  target: 'magnet',      polarity: 1, note: 'PrNd合金改善性能' },
    { source: 'dy',  target: 'magnet',      polarity: 1, note: '提高矫顽力，耐高温' },
    { source: 'tb',  target: 'magnet',      polarity: 1, note: '提高矫顽力，耐高温' },
    { source: 'magnet', target: 'ev_motor', polarity: 1, note: '稀土永磁电机为主流方案' },
    { source: 'magnet', target: 'wind_gen', polarity: 1, note: '直驱永磁风机用钕铁硼约吨级/台' },
    { source: 'magnet', target: 'industrial_motor', polarity: 1, note: '伺服/关节永磁电机' },
    { source: 'ev_motor', target: 'auto',   polarity: 1, note: '铃木停产；汽车占工业总产值40%' },
    { source: 'wind_gen', target: 'wind_power', polarity: 1, note: '永磁直驱风机' },
    { source: 'industrial_motor', target: 'robotics', polarity: 1, note: '机器人关节伺服电机' },

    // --- 钐钴磁体链（钐 -> 钐钴 -> 航天/军工） ---
    { source: 'sm',  target: 'smco',        polarity: 1, note: '钐钴磁体原料' },
    { source: 'smco', target: 'aerospace',  polarity: 1, note: '耐高温抗腐蚀，航天器电机/传感器' },
    { source: 'smco', target: 'defense',    polarity: 1, note: '军工高温传感器/制导' },

    // --- 光通信链（铽/钆 -> 光隔离器；铒 -> EDFA） ---
    { source: 'tb',  target: 'isolator',    polarity: 1, note: '光隔离器核心元件，100%依赖中国' },
    { source: 'gd',  target: 'isolator',    polarity: 1, note: '磁光材料，100%依赖中国' },
    { source: 'isolator', target: 'opt_module', polarity: 1, note: '高速光模块离不开光隔离器' },
    { source: 'opt_module', target: 'opt_comms', polarity: 1, note: '高速光模块->AI光通信' },
    { source: 'er',  target: 'edfa',        polarity: 1, note: '掺铒光纤放大器，不可替代' },
    { source: 'edfa', target: 'opt_comms',  polarity: 1, note: '骨干网中继放大' },

    // --- 铈链（铈 -> 抛光粉 -> 晶圆CMP -> 半导体；铈 -> 催化剂 -> 尾气 -> 汽车） ---
    { source: 'ce',  target: 'ceo2',        polarity: 1, note: '二氧化铈抛光粉' },
    { source: 'ceo2',target: 'wafer_polish',polarity: 1, note: 'CMP化学机械抛光' },
    { source: 'wafer_polish', target: 'semiconductor_mfg', polarity: 1, note: '晶圆平坦化决定良率' },
    { source: 'ce',  target: 'ceria_catalyst', polarity: 1, note: '铈基储氧催化' },
    { source: 'ceria_catalyst', target: 'exhaust', polarity: 1, note: '三效催化转化器' },
    { source: 'exhaust', target: 'auto',    polarity: 1, note: '汽车尾气后处理' },

    // --- 镧链（镧 -> 储氢合金 -> 镍氢电池 -> 汽车；镧 -> 光学玻璃 -> 镜头 -> 医疗） ---
    { source: 'la',  target: 'hydride',     polarity: 1, note: 'LaNi5储氢合金' },
    { source: 'hydride', target: 'nimh',    polarity: 1, note: '镍氢电池负极' },
    { source: 'nimh', target: 'auto',       polarity: 1, note: '丰田THS混动动力电池' },
    { source: 'la',  target: 'optical_glass', polarity: 1, note: '高折射低色散光学玻璃' },
    { source: 'optical_glass', target: 'lens', polarity: 1, note: '镜头镜片' },
    { source: 'lens', target: 'medical',    polarity: 1, note: '内窥镜/手术光学' },

    // --- 铕链（铕 -> 红色荧光粉 -> 显示） ---
    { source: 'eu',  target: 'red_phosphor',polarity: 1, note: 'Eu³⁺红色荧光粉，不可替代' },
    { source: 'red_phosphor', target: 'display', polarity: 1, note: '显示三基色红色通道' },

    // --- 钪链（钪 -> 铝钪合金 -> 航天） ---
    { source: 'sc',  target: 'alsc',        polarity: 1, note: '铝钪合金' },
    { source: 'alsc', target: 'aerospace',  polarity: 1, note: '航天器/导弹结构件' },

    // --- 锑链（锑 -> 含锑铅 -> 军工） ---
    { source: 'sb',  target: 'sb_lead',     polarity: 1, note: '含锑铅硬化' },
    { source: 'sb_lead', target: 'defense', polarity: 1, note: '弹药破甲' },

    // --- 钆链扩展（钆 -> MRI造影剂 -> 医疗） ---
    { source: 'gd',  target: 'mri_contrast',polarity: 1, note: '钆螯合物造影剂' },
    { source: 'mri_contrast', target: 'medical', polarity: 1, note: '磁共振增强成像' },

    // --- 氦气链（战略气体；氦气 -> 光纤/MRI冷却/火箭/半导体/雷达） ---
    { source: 'he',  target: 'fiber',        polarity: 1, note: '光纤预制棒拉丝保护气' },
    { source: 'fiber', target: 'opt_module', polarity: 1, note: '光纤->光模块' },
    { source: 'he',  target: 'mri_cooling',  polarity: 1, note: '超导磁体液氦冷却' },
    { source: 'mri_cooling', target: 'medical', polarity: 1, note: 'MRI需液氦维持4K' },
    { source: 'he',  target: 'rocket_press', polarity: 1, note: '推进剂加压与管路吹扫' },
    { source: 'rocket_press', target: 'aerospace', polarity: 1, note: '火箭测试必需' },
    { source: 'he',  target: 'semiconductor_mfg', polarity: 1, note: '半导体制造保护气/载气' },
    { source: 'he',  target: 'radar_sensor', polarity: 1, note: '军用雷达/传感器制造' },
    { source: 'radar_sensor', target: 'defense', polarity: 1, note: '雷达/传感器->军工' },
  ],
};

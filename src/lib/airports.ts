import type { Airport } from "./types";

export const AIRPORTS: Airport[] = [
  {
    code: "PEK",
    city: "北京",
    name: "首都国际机场",
    country: "CN",
    region: "CN",
    nearby: ["PKX"],
  },
  {
    code: "PKX",
    city: "北京",
    name: "大兴国际机场",
    country: "CN",
    region: "CN",
    nearby: ["PEK"],
  },
  {
    code: "SHA",
    city: "上海",
    name: "虹桥国际机场",
    country: "CN",
    region: "CN",
    nearby: ["PVG"],
  },
  {
    code: "PVG",
    city: "上海",
    name: "浦东国际机场",
    country: "CN",
    region: "CN",
    nearby: ["SHA"],
  },
  {
    code: "CAN",
    city: "广州",
    name: "白云国际机场",
    country: "CN",
    region: "CN",
    nearby: ["SZX"],
  },
  {
    code: "SZX",
    city: "深圳",
    name: "宝安国际机场",
    country: "CN",
    region: "CN",
    nearby: ["CAN", "HKG"],
  },
  {
    code: "CTU",
    city: "成都",
    name: "双流国际机场",
    country: "CN",
    region: "CN",
    nearby: ["TFU"],
  },
  {
    code: "TFU",
    city: "成都",
    name: "天府国际机场",
    country: "CN",
    region: "CN",
    nearby: ["CTU"],
  },
  {
    code: "HGH",
    city: "杭州",
    name: "萧山国际机场",
    country: "CN",
    region: "CN",
  },
  {
    code: "XIY",
    city: "西安",
    name: "咸阳国际机场",
    country: "CN",
    region: "CN",
  },
  {
    code: "CKG",
    city: "重庆",
    name: "江北国际机场",
    country: "CN",
    region: "CN",
  },
  {
    code: "WUH",
    city: "武汉",
    name: "天河国际机场",
    country: "CN",
    region: "CN",
  },
  {
    code: "NKG",
    city: "南京",
    name: "禄口国际机场",
    country: "CN",
    region: "CN",
  },
  {
    code: "XMN",
    city: "厦门",
    name: "高崎国际机场",
    country: "CN",
    region: "CN",
  },
  {
    code: "KMG",
    city: "昆明",
    name: "长水国际机场",
    country: "CN",
    region: "CN",
  },
  {
    code: "HKG",
    city: "香港",
    name: "香港国际机场",
    country: "HK",
    region: "ASIA",
    nearby: ["SZX", "MFM"],
  },
  {
    code: "MFM",
    city: "澳门",
    name: "澳门国际机场",
    country: "MO",
    region: "ASIA",
    nearby: ["HKG", "SZX"],
  },
  {
    code: "TPE",
    city: "台北",
    name: "桃园国际机场",
    country: "TW",
    region: "ASIA",
  },
  {
    code: "NRT",
    city: "东京",
    name: "成田国际机场",
    country: "JP",
    region: "ASIA",
    nearby: ["HND"],
  },
  {
    code: "HND",
    city: "东京",
    name: "羽田机场",
    country: "JP",
    region: "ASIA",
    nearby: ["NRT"],
  },
  {
    code: "ICN",
    city: "首尔",
    name: "仁川国际机场",
    country: "KR",
    region: "ASIA",
  },
  {
    code: "BKK",
    city: "曼谷",
    name: "素万那普机场",
    country: "TH",
    region: "ASIA",
  },
  {
    code: "SIN",
    city: "新加坡",
    name: "樟宜机场",
    country: "SG",
    region: "ASIA",
  },
  {
    code: "KUL",
    city: "吉隆坡",
    name: "吉隆坡国际机场",
    country: "MY",
    region: "ASIA",
  },
  {
    code: "DXB",
    city: "迪拜",
    name: "迪拜国际机场",
    country: "AE",
    region: "ASIA",
  },
  {
    code: "LHR",
    city: "伦敦",
    name: "希思罗机场",
    country: "GB",
    region: "EU",
    nearby: ["LGW", "STN"],
  },
  {
    code: "CDG",
    city: "巴黎",
    name: "戴高乐机场",
    country: "FR",
    region: "EU",
  },
  {
    code: "FRA",
    city: "法兰克福",
    name: "法兰克福机场",
    country: "DE",
    region: "EU",
  },
  {
    code: "AMS",
    city: "阿姆斯特丹",
    name: "史基浦机场",
    country: "NL",
    region: "EU",
  },
  {
    code: "LAX",
    city: "洛杉矶",
    name: "洛杉矶国际机场",
    country: "US",
    region: "NA",
  },
  {
    code: "SFO",
    city: "旧金山",
    name: "旧金山国际机场",
    country: "US",
    region: "NA",
  },
  {
    code: "JFK",
    city: "纽约",
    name: "肯尼迪国际机场",
    country: "US",
    region: "NA",
    nearby: ["EWR", "LGA"],
  },
  {
    code: "SEA",
    city: "西雅图",
    name: "西雅图机场",
    country: "US",
    region: "NA",
  },
  {
    code: "SYD",
    city: "悉尼",
    name: "悉尼机场",
    country: "AU",
    region: "OTHER",
  },
];

const byCode = new Map(AIRPORTS.map((a) => [a.code, a]));

export function getAirport(code: string): Airport | undefined {
  return byCode.get(code.toUpperCase());
}

export function routeKey(origin: string, destination: string, date: string) {
  return `${origin.toUpperCase()}-${destination.toUpperCase()}-${date}`;
}

export function popularRoutes(): Array<{
  origin: string;
  destination: string;
  label: string;
}> {
  return [
    { origin: "PEK", destination: "SHA", label: "北京 → 上海" },
    { origin: "CAN", destination: "PEK", label: "广州 → 北京" },
    { origin: "PVG", destination: "NRT", label: "上海 → 东京" },
    { origin: "SZX", destination: "BKK", label: "深圳 → 曼谷" },
    { origin: "PEK", destination: "LHR", label: "北京 → 伦敦" },
    { origin: "PVG", destination: "LAX", label: "上海 → 洛杉矶" },
    { origin: "CTU", destination: "ICN", label: "成都 → 首尔" },
    { origin: "HKG", destination: "SIN", label: "香港 → 新加坡" },
  ];
}

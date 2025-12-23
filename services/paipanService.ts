/**
 * 八字排盘服务
 * 使用 lunar-javascript 库进行八字计算
 */

// @ts-ignore - lunar-javascript 没有 TypeScript 类型定义
import { Solar } from 'lunar-javascript';

/**
 * 用户出生时间输入
 */
export interface BirthTimeInput {
  year: number;         // 出生年份 (阳历)，如 1990
  month: number;        // 出生月份 (阳历)，1-12
  day: number;          // 出生日期 (阳历)，1-31
  hour: number;         // 出生时辰，0-23（-1 表示不知道时辰）
  minute: number;       // 出生分钟，0-59
  gender: 'male' | 'female';  // 性别
}

/**
 * 大运信息
 */
export interface DaYunInfo {
  ganZhi: string;       // 大运干支
  startAge: number;     // 开始年龄
  endAge: number;       // 结束年龄
}

/**
 * 排盘结果
 */
export interface PaipanResult {
  // 四柱信息
  yearPillar: string;   // 年柱，如 "庚午"
  monthPillar: string;  // 月柱，如 "辛巳"
  dayPillar: string;    // 日柱，如 "甲申"
  hourPillar: string;   // 时柱，如 "己巳"
  
  // 大运信息
  startAge: number;     // 起运年龄（虚岁）
  firstDaYun: string;   // 第一步大运干支
  daYunDirection: 'forward' | 'backward';  // 大运方向
  
  // 附加信息
  lunarDate: string;    // 农历日期
  solarTerm: string;    // 节气
  zodiac: string;       // 生肖
  dayMaster: string;    // 日主（日干）
  birthYear: number;    // 出生年份
  
  // 大运列表（10步）
  daYunList: DaYunInfo[];
}

/**
 * 时辰信息
 */
export interface ShiChenInfo {
  value: number;        // 小时值（用于计算）
  label: string;        // 时辰名称
  range: string;        // 时间范围
  diZhi: string;        // 地支
}

/**
 * 获取十二时辰列表
 */
export function getShiChenList(): ShiChenInfo[] {
  return [
    { value: 0,  label: '子时', range: '23:00-01:00', diZhi: '子' },
    { value: 2,  label: '丑时', range: '01:00-03:00', diZhi: '丑' },
    { value: 4,  label: '寅时', range: '03:00-05:00', diZhi: '寅' },
    { value: 6,  label: '卯时', range: '05:00-07:00', diZhi: '卯' },
    { value: 8,  label: '辰时', range: '07:00-09:00', diZhi: '辰' },
    { value: 10, label: '巳时', range: '09:00-11:00', diZhi: '巳' },
    { value: 12, label: '午时', range: '11:00-13:00', diZhi: '午' },
    { value: 14, label: '未时', range: '13:00-15:00', diZhi: '未' },
    { value: 16, label: '申时', range: '15:00-17:00', diZhi: '申' },
    { value: 18, label: '酉时', range: '17:00-19:00', diZhi: '酉' },
    { value: 20, label: '戌时', range: '19:00-21:00', diZhi: '戌' },
    { value: 22, label: '亥时', range: '21:00-23:00', diZhi: '亥' },
  ];
}

/**
 * 根据出生时间自动排盘
 */
export function calculateBazi(input: BirthTimeInput): PaipanResult {
  // 处理不知道时辰的情况，默认用午时（12点）
  const hour = input.hour === -1 ? 12 : input.hour;
  const minute = input.hour === -1 ? 0 : input.minute;
  
  // 1. 创建阳历日期对象
  const solar = Solar.fromYmdHms(
    input.year,
    input.month,
    input.day,
    hour,
    minute,
    0
  );
  
  // 2. 获取农历信息
  const lunar = solar.getLunar();
  
  // 3. 获取八字
  const bazi = lunar.getEightChar();
  
  // 4. 获取四柱
  const yearPillar = bazi.getYear();
  const monthPillar = bazi.getMonth();
  const dayPillar = bazi.getDay();
  const hourPillar = bazi.getTime();
  
  // 5. 获取大运（1=男, 0=女）
  const genderValue = input.gender === 'male' ? 1 : 0;
  const yun = bazi.getYun(genderValue);
  
  // 6. 获取起运年龄
  const startAge = yun.getStartYear();
  
  // 7. 获取大运列表
  const daYunArr = yun.getDaYun();
  const daYunList: DaYunInfo[] = [];
  
  // 跳过第一个（童限），获取后续10步大运
  for (let i = 1; i <= 10 && i < daYunArr.length; i++) {
    const dy = daYunArr[i];
    daYunList.push({
      ganZhi: dy.getGanZhi(),
      startAge: startAge + (i - 1) * 10,
      endAge: startAge + i * 10 - 1,
    });
  }
  
  // 8. 判断大运方向（顺行/逆行）
  const yearGan = yearPillar.charAt(0);
  const yangGans = ['甲', '丙', '戊', '庚', '壬'];
  const isYangYear = yangGans.includes(yearGan);
  const isForward = input.gender === 'male' ? isYangYear : !isYangYear;
  
  // 9. 获取节气
  let solarTerm = '';
  try {
    const jieQi = lunar.getJieQi();
    solarTerm = jieQi || '';
  } catch {
    solarTerm = '';
  }
  
  // 10. 构建农历日期字符串
  const lunarYear = lunar.getYearInGanZhi();
  const lunarMonth = lunar.getMonthInChinese();
  const lunarDay = lunar.getDayInChinese();
  const lunarDate = `${lunarYear}年${lunarMonth}月${lunarDay}`;
  
  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    startAge,
    firstDaYun: daYunList[0]?.ganZhi || '',
    daYunDirection: isForward ? 'forward' : 'backward',
    lunarDate,
    solarTerm,
    zodiac: lunar.getYearShengXiao(),
    dayMaster: dayPillar.charAt(0),
    birthYear: input.year,
    daYunList,
  };
}

/**
 * 根据小时获取时辰名称
 */
export function getShiChenByHour(hour: number): ShiChenInfo | null {
  const shiChenList = getShiChenList();
  
  // 特殊处理子时（23:00-01:00）
  if (hour === 23 || hour === 0) {
    return shiChenList[0]; // 子时
  }
  
  // 其他时辰
  for (const sc of shiChenList) {
    if (hour >= sc.value && hour < sc.value + 2) {
      return sc;
    }
  }
  
  return null;
}

/**
 * 验证日期是否有效
 */
export function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * 获取指定年月的天数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}


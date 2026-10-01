/* ==========================================================================
   月相：客户端按访问日期重画，构建时也要预画一帧亮面。
   两处共用这一份，别把公式抄两遍。
   ========================================================================== */

export interface MoonPhase {
  /** 0~1 相位 */
  p: number
  /** 亮度百分比 */
  illum: number
  /** 亮度 0~1 原值，给 CSS 当插值系数用（illum 是取整过的百分数，不能拿来算） */
  lit: number
  /** 月龄（天，取整） */
  age: number
  name: string
  latin: string
}

export const SYNODIC = 29.530588853
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) // 一次已知新月
const PHASES: { until: number; name: string; latin: string }[] = [
  { until: 0.03, name: '新月', latin: 'NEW MOON' },
  { until: 0.22, name: '娥眉月', latin: 'WAXING CRESCENT' },
  { until: 0.28, name: '上弦月', latin: 'FIRST QUARTER' },
  { until: 0.47, name: '盈凸月', latin: 'WAXING GIBBOUS' },
  { until: 0.53, name: '满月', latin: 'FULL MOON' },
  { until: 0.72, name: '亏凸月', latin: 'WANING GIBBOUS' },
  { until: 0.78, name: '下弦月', latin: 'LAST QUARTER' },
  { until: 0.97, name: '残月', latin: 'WANING CRESCENT' },
]

/** 低于这个亮度就当新月：亮面只剩贴边一条缝，不如整轮交给地照光 */
const NEW_MOON_ILLUM = 0.02

export function moonPhase(date: Date = new Date()): MoonPhase {
  const days = (date.getTime() - NEW_MOON) / 86400000
  let p = (days % SYNODIC) / SYNODIC
  if (p < 0) p += 1
  const raw = (1 - Math.cos(2 * Math.PI * p)) / 2
  const phase = PHASES.find((x) => p < x.until) ?? PHASES[0]
  return {
    p,
    illum: Math.round(raw * 100),
    lit: raw,
    age: Math.round(p * SYNODIC),
    name: phase.name,
    latin: phase.latin,
  }
}

/**
 * 亮面轮廓 = 外沿半圆 + 半条椭圆终止线，画在 viewBox 0 0 100 100 里。
 * rx = 50·cos(2πp)：新月 rx=50（亮面缩成贴边一条缝），上下弦 rx=0
 * （SVG 把零半径的弧当直线，正好一条直界），满月 rx=−50。
 * 于是亮区面积 / 整圆 = (1 − cos2πp) / 2 = 真实亮度，不是两圆相切的近似。
 * 盈月亮面在右、亏月在左（北半球口径，和 favicon 那个固定缺口一致）。
 */
export function litPathD(p: number): string {
  const k = Math.cos(2 * Math.PI * p)
  if ((1 - k) / 2 < NEW_MOON_ILLUM) return ''
  const dir = p < 0.5 ? 1 : -1
  const limb = dir > 0 ? 1 : 0
  const term = (k > 0) === (dir > 0) ? 0 : 1
  return `M 50 0 A 50 50 0 0 ${limb} 50 100 A ${(Math.abs(k) * 50).toFixed(2)} 50 0 0 ${term} 50 0 Z`
}

/**
 * 記帳專用的計算機狀態機。
 * 支援：四則運算（+ - × ÷）、AC、退格、結果評估。
 *
 * 用法：
 *   const [state, dispatch] = useReducer(calcReducer, calcInitial)
 *   dispatch({ type: 'digit', d: '7' })
 *   dispatch({ type: 'op', op: '+' })
 *   ...
 *   const amount = evaluateCalc(state)  // 在送出時呼叫
 */

export type CalcOp = '+' | '-' | '×' | '÷'

export interface CalcState {
  /** 已累計的前值（例如 120 + 50 中的 120） */
  prev: number | null
  /** 待運算的運算子 */
  op: CalcOp | null
  /** 目前輸入字串（顯示用） */
  current: string
  /** 剛按完運算子，下一個數字會取代 current */
  awaiting: boolean
}

export const calcInitial: CalcState = {
  prev: null,
  op: null,
  current: '0',
  awaiting: false,
}

export type CalcAction =
  | { type: 'digit'; d: string } // '0'..'9' 或 '00'
  | { type: 'dot' }
  | { type: 'op'; op: CalcOp }
  | { type: 'clear' }
  | { type: 'back' }

const MAX_LEN = 12

function compute(prev: number, op: CalcOp, b: number): number {
  switch (op) {
    case '+':
      return prev + b
    case '-':
      return prev - b
    case '×':
      return prev * b
    case '÷':
      return b === 0 ? prev : prev / b
  }
}

function toStr(n: number): string {
  // 用最簡單的方式呈現：整數不顯示小數，浮點保留必要位數
  if (Number.isInteger(n)) return String(n)
  return String(parseFloat(n.toFixed(6)))
}

export function calcReducer(s: CalcState, a: CalcAction): CalcState {
  switch (a.type) {
    case 'digit': {
      const d = a.d
      if (s.awaiting) {
        return {
          ...s,
          current: d === '00' ? '0' : d,
          awaiting: false,
        }
      }
      if (s.current === '0') {
        if (d === '00') return s
        return { ...s, current: d }
      }
      if (s.current.length + d.length > MAX_LEN) return s
      return { ...s, current: s.current + d }
    }

    case 'dot': {
      if (s.awaiting) {
        return { ...s, current: '0.', awaiting: false }
      }
      if (s.current.includes('.')) return s
      if (s.current.length >= MAX_LEN) return s
      return { ...s, current: s.current + '.' }
    }

    case 'op': {
      // 連按運算子 → 換成新的運算子
      if (s.awaiting && s.prev !== null) {
        return { ...s, op: a.op }
      }
      const cur = parseFloat(s.current)
      if (s.prev === null) {
        return { prev: cur, op: a.op, current: s.current, awaiting: true }
      }
      const next = compute(s.prev, s.op!, cur)
      return {
        prev: next,
        op: a.op,
        current: toStr(next),
        awaiting: true,
      }
    }

    case 'clear':
      return calcInitial

    case 'back': {
      if (s.awaiting) {
        // 在等待輸入時按退格 → 取消累計的運算
        return { ...s, op: null, prev: null, awaiting: false }
      }
      if (s.current.length <= 1) return { ...s, current: '0' }
      return { ...s, current: s.current.slice(0, -1) }
    }
  }
}

/** 評估目前狀態的最終數值（送出時呼叫） */
export function evaluateCalc(s: CalcState): number {
  const cur = parseFloat(s.current)
  if (s.prev === null || s.op === null) return cur
  // 若還沒輸入新數字就送出（如 120 + OK），直接用 prev
  if (s.awaiting) return s.prev
  return compute(s.prev, s.op, cur)
}

/** 給顯示用：若有累計值，回傳 "120 +" 這樣的提示 */
export function getCalcHint(s: CalcState): string {
  if (s.prev === null || s.op === null) return ''
  return `${toStr(s.prev)} ${s.op}`
}

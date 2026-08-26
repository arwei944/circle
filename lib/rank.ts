import { LexoRank } from '@/lib/utils';

interface LexEntry {
   lex: LexoRank;
   full: boolean;
}

/**
 * `@kayron013/lexorank` 的 `LexoRank.from` 只接受 `bucket|value`（如 `0|a3c`）
 * 完整格式；而本模块接口以裸值 `a3c` 表达（简报测试即如此）。
 * 因此按输入是否含 `|` 原样保留格式：裸值按 bucket `0` 处理并返回裸值，
 * 完整格式原样返回，保证与数据库种子（`0|…`）排序兼容。
 */
function toLexoRank(s: string): LexEntry {
   const full = s.includes('|');
   return { lex: LexoRank.from(full ? s : `0|${s}`), full };
}

function fromLexoRank(lex: LexoRank, full: boolean): string {
   const s = lex.toString();
   return full ? s : s.slice(2);
}

/**
 * 返回一个严格在 lo 与 hi 之间的 LexoRank 字符串（升序语义）。
 * 任一为 null 表示该方向开放。lo 恒 < hi（由调用方保证）。
 */
export function computeRankBetween(lo: string | null, hi: string | null): string {
   const loEntry = lo ? toLexoRank(lo) : null;
   const hiEntry = hi ? toLexoRank(hi) : null;
   if (loEntry && hiEntry) {
      const mid = LexoRank.between(loEntry.lex, hiEntry.lex);
      return fromLexoRank(mid, loEntry.full || hiEntry.full);
   }
   if (loEntry) return fromLexoRank(LexoRank.between(loEntry.lex, null), loEntry.full);
   if (hiEntry) return fromLexoRank(LexoRank.between(null, hiEntry.lex), hiEntry.full);
   return 'a3c';
}

export function topRankFrom(currentTop: string | null): string {
   if (!currentTop) return LexoRank.from('0|a3c').toString(); // '0|a3c'（full 格式，与 seed 生态一致）
   return computeRankBetween(currentTop, null);
}

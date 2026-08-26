/**
 * 将 Date 序列化为本地时区的 `yyyy-MM-dd`。
 *
 * 与 `lib/dto.ts` 的 `toDateString`（UTC ISO slice）不同：shadcn Calendar
 * 返回的 Date 是「本地零点」，对 UTC+X 时区若用 UTC slice 会把 2026-01-15
 * 序列化成 2026-01-14。此处用本地日期字段拼装，保证选中即落库当天。
 */
export function toLocalDateString(d: Date): string {
   const y = d.getFullYear();
   const m = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   return `${y}-${m}-${day}`;
}

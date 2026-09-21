export type PageItem = number | "gap-start" | "gap-end";

// Up to 7 slots, so a pagination bar never changes width while paging:
//   few pages:   1 2 3 4 5
//   near start:  1 2 3 4 5 … 12
//   in middle:   1 … 5 6 7 … 12
//   near end:    1 … 8 9 10 11 12
export const pageItems = (page: number, total: number): PageItem[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "gap-end", total];
  if (page >= total - 3) return [1, "gap-start", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "gap-start", page - 1, page, page + 1, "gap-end", total];
};

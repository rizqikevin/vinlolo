const parseShelfTime = (rawValue: string): Date | null => {
  if (!rawValue) return null;
  const date = new Date(rawValue.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatShelfTime = (rawValue: string): string => {
  const date = parseShelfTime(rawValue);
  if (!date) return rawValue || "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
};

export const formatUpdatedAt = (value: Date | null): string => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(value);
};

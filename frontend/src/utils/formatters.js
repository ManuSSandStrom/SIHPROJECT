import { format, parseISO } from "date-fns";

export function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value, dateFormat = "dd MMM yyyy") {
  if (!value) {
    return "-";
  }

  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, dateFormat);
}

export function titleCase(value = "") {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function percentage(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

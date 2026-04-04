export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseDateKey = (dateKey: string): Date => {
  const [yearPart, monthPart, dayPart] = dateKey.split("-");

  if (!yearPart || !monthPart || !dayPart) {
    return new Date(Number.NaN);
  }

  const year = Number(yearPart);
  const month = Number(monthPart) - 1;
  const day = Number(dayPart);

  return new Date(year, month, day);
};

export const isDateKeyWithinRange = (
  dateKey: string,
  startKey: string,
  endKey: string
): boolean => dateKey >= startKey && dateKey <= endKey;

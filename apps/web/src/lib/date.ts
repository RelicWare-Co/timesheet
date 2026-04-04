export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{1,2}-\d{1,2}$/;

export const parseDateKey = (dateKey: string): Date => {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return new Date(Number.NaN);
  }

  const [yearPart, monthPart, dayPart] = dateKey.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart) - 1;
  const day = Number(dayPart);
  const parsedDate = new Date(year, month, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month ||
    parsedDate.getDate() !== day
  ) {
    return new Date(Number.NaN);
  }

  return parsedDate;
};

export const isDateKeyWithinRange = (
  dateKey: string,
  startKey: string,
  endKey: string
): boolean => dateKey >= startKey && dateKey <= endKey;

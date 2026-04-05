const RECENT_SAVED_LOG_DATE_KEY = "timesheet:last-saved-log-date";

const isBrowser = (): boolean => typeof window !== "undefined";

export const saveRecentLogDate = (dateKey: string): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.setItem(RECENT_SAVED_LOG_DATE_KEY, dateKey);
  } catch {
    // Ignore storage errors in restrictive browser modes.
  }
};

export const readRecentLogDate = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.sessionStorage.getItem(RECENT_SAVED_LOG_DATE_KEY);
  } catch {
    return null;
  }
};

export const clearRecentLogDate = (): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(RECENT_SAVED_LOG_DATE_KEY);
  } catch {
    // Ignore storage errors in restrictive browser modes.
  }
};

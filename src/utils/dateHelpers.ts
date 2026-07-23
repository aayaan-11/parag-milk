/**
 * Formats a date string (either yyyy-mm-dd or ISO string) to dd/mm/yyyy
 */
export function formatDateToDMY(dateStr: string): string {
  if (!dateStr) return '';
  // Check if already in dd/mm/yyyy format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  try {
    // Try simple split first for yyyy-mm-dd
    const justDate = dateStr.split('T')[0];
    const parts = justDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4) {
        return `${day}/${month}/${year}`;
      }
    }
  } catch (e) {
    console.error("Error formatting date in fast parse:", e);
  }
  
  // Fallback to JS Date object
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    console.error("Error parsing date:", e);
  }
  
  return dateStr;
}

/**
 * Returns today's date formatted as dd/mm/yyyy
 */
export function getTodayFormattedDMY(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Computes the start of the CURRENT membership period for a Pro account
// — anchored to the day-of-month they upgraded, not the calendar month.
// e.g. upgraded Aug 15 -> periods run Aug 15-Sep 14, Sep 15-Oct 14, etc.
export function currentMembershipPeriodStart(proSince: string | Date): Date {
  const anchor = new Date(proSince);
  const anchorDay = anchor.getDate();
  const now = new Date();

  const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const thisMonthAnchorDay = Math.min(anchorDay, daysInThisMonth);
  let candidate = new Date(now.getFullYear(), now.getMonth(), thisMonthAnchorDay);

  if (candidate > now) {
    const prevMonth = now.getMonth() - 1;
    const daysInPrevMonth = new Date(now.getFullYear(), prevMonth + 1, 0).getDate();
    candidate = new Date(now.getFullYear(), prevMonth, Math.min(anchorDay, daysInPrevMonth));
  }

  return candidate;
}
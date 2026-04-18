export type DeadlineState = "none" | "safe" | "urgent" | "overdue";

const BRONZE = "#CD7F32";
const GOLD = "#D4AF37";
const CHAMPAGNE = "#F1E5AC";

export function getDeadlineState(deadlineAt?: string | null): DeadlineState {
  if (!deadlineAt) return "none";
  const deadlineMs = new Date(deadlineAt).getTime();
  const nowMs = Date.now();
  const diffMs = deadlineMs - nowMs;
  if (diffMs < 0) return "overdue";
  if (diffMs <= 6 * 60 * 60 * 1000) return "urgent";
  return "safe";
}

export function humanDeadline(deadlineAt: string): string {
  const deadlineMs = new Date(deadlineAt).getTime();
  const nowMs = Date.now();
  const diffMs = deadlineMs - nowMs;
  const absDiff = Math.abs(diffMs);

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    if (days >= 2) return `Missed by ${days} days`;
    if (days === 1) return "Missed by 1 day";
    if (hours >= 1) return `Missed by ${hours} hour${hours > 1 ? "s" : ""}`;
    return "Just missed";
  }

  if (days >= 2) return `Due in ${days} days`;
  if (days === 1) return "Due tomorrow";
  if (hours >= 1) return `Due in ${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes >= 30) return "Due in less than an hour";
  return "Deadline very soon";
}

export function deadlineAccentColor(state: DeadlineState): string {
  switch (state) {
    case "overdue": return BRONZE;
    case "urgent": return GOLD;
    case "safe": return CHAMPAGNE;
    default: return "transparent";
  }
}

export function buildNotificationBody(taskName: string, deadlineAt: string): string {
  const state = getDeadlineState(deadlineAt);
  const humanTime = humanDeadline(deadlineAt);
  if (state === "overdue") {
    return `"${taskName}" — ${humanTime}. Mark it done when you can, boss.`;
  }
  if (state === "urgent") {
    return `Hey! "${taskName}" is due very soon. Don't forget the slip!`;
  }
  return `Reminder: "${taskName}" — ${humanTime}.`;
}

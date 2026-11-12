import type { FocusSession } from "@/types";
import { localDate } from "@/lib/utils";
import { elapsedMs } from "@/features/focus/timer";
export const sessionsOnDate = (sessions: FocusSession[], date: string) =>
  sessions.filter(
    (session) => localDate(session.endedAt ?? session.startedAt) === date,
  );
export const totalFocusMs = (sessions: FocusSession[], now: number) =>
  sessions.reduce((total, session) => total + elapsedMs(session, now), 0);

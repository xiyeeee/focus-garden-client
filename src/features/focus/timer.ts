import type { FocusSession, GardenData } from "@/types";
export const isActive = (session: FocusSession) =>
  ["running", "paused"].includes(session.status);
export const elapsedMs = (session: FocusSession, now = Date.now()) =>
  Math.min(
    session.plannedMinutes * 60000,
    Math.max(
      0,
      session.actualMs +
        (session.status === "running" && session.resumedAt !== null
          ? Math.max(0, now - session.resumedAt)
          : 0),
    ),
  );
export const settleSessions = (data: GardenData, now = Date.now()) => {
  data.sessions.forEach((session) => {
    if (
      session.status !== "running" ||
      elapsedMs(session, now) < session.plannedMinutes * 60000
    )
      return;
    const endedAt =
      (session.resumedAt ?? now) +
      Math.max(0, session.plannedMinutes * 60000 - session.actualMs);
    session.actualMs = session.plannedMinutes * 60000;
    session.status = "completed";
    session.endedAt = endedAt;
    session.resumedAt = null;
    if (!data.plants.some((plant) => plant.sessionId === session.id))
      data.plants.push({
        id: `plant-${session.id}`,
        type: session.plantType,
        sessionId: session.id,
        obtainedAt: endedAt,
      });
  });
  return data;
};

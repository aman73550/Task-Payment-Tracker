import { useEffect } from "react";
import { Platform } from "react-native";

import { Task } from "@/context/TasksContext";
import { buildNotificationBody, getDeadlineState } from "@/utils/deadline";

const notifiedRegistry = new Set<string>();

export function useDeadlineNotifications(tasks: Task[]) {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const checkDeadlines = async () => {
      const activeTasks = tasks.filter(
        (t) => t.deadline_at && !t.work_done && !t.payment_received
      );
      if (activeTasks.length === 0) return;

      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") return;

      for (const taskEntry of activeTasks) {
        const state = getDeadlineState(taskEntry.deadline_at);
        if (state === "none" || state === "safe") continue;
        const notifKey = `${taskEntry.id}_${state}`;
        if (notifiedRegistry.has(notifKey)) continue;
        notifiedRegistry.add(notifKey);
        const body = buildNotificationBody(taskEntry.task_name, taskEntry.deadline_at!);
        const title = state === "overdue" ? "Task Overdue" : "Deadline Alert";
        new Notification(title, { body });
      }
    };

    checkDeadlines();
  }, [tasks]);
}

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { taskApi } from "@/services/tasks/api";
import type { TaskQueryDTO } from "@/services/tasks/types";
export const taskKeys = {
  all: ["tasks"] as const,
  lists: ["tasks", "list"] as const,
  list: (query: TaskQueryDTO) => ["tasks", "list", query] as const,
  detail: (id: string) => ["tasks", "detail", id] as const,
};
export const useTaskList = (query: TaskQueryDTO) =>
  useQuery({
    queryKey: taskKeys.list(query),
    queryFn: ({ signal }) => taskApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
export const useTaskTotals = () => {
  const all = useQuery({
    queryKey: taskKeys.list({ page: 1, size: 1 }),
    queryFn: ({ signal }) => taskApi.list({ page: 1, size: 1 }, signal),
  });
  const completed = useQuery({
    queryKey: taskKeys.list({ page: 1, size: 1, status: "COMPLETED" }),
    queryFn: ({ signal }) =>
      taskApi.list({ page: 1, size: 1, status: "COMPLETED" }, signal),
  });
  return { all, completed };
};

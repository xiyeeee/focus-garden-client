import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ListTodo,
  ClipboardCheck,
  Clock3,
  Search,
  RefreshCw,
  ArrowUpRight,
  Sprout,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/layout/PageHeading";
import { GardenScene } from "@/components/garden/GardenScene";
import { TaskEditorDialog } from "@/features/tasks/TaskEditorDialog";
import { TaskDeleteDialog } from "@/features/tasks/TaskDeleteDialog";
import { TaskRow } from "@/features/tasks/TaskRow";
import { taskKeys, useTaskList, useTaskTotals } from "@/features/tasks/queries";
import { taskApi } from "@/services/tasks/api";
import { ApiError, errorMessage } from "@/services/http";
import type { TaskStatus } from "@/services/tasks/types";
import type { TaskRecord } from "@/features/tasks/task-model";
const filters: { label: string; status?: TaskStatus }[] = [
  { label: "全部" },
  { label: "待开始", status: "TODO" },
  { label: "进行中", status: "IN_PROGRESS" },
  { label: "已完成", status: "COMPLETED" },
];
export const TasksPage = () => {
  const [date] = useState(() =>
    new Date().toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    }),
  );
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TaskStatus | undefined>();
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TaskRecord | null>(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const acting = useRef(false);
  const query = useTaskList({
    page,
    size: 10,
    status,
    title: title || undefined,
    sortBy: "createdAt",
    direction: "desc",
  });
  const totals = useTaskTotals();
  const toggle = useMutation({
    mutationFn: (task: TaskRecord) =>
      task.status === "COMPLETED"
        ? taskApi.reopen(task)
        : taskApi.complete(task.id),
    onSuccess: (task) => {
      queryClient.setQueryData(taskKeys.detail(task.id), task);
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
      setMessage(
        task.status === "COMPLETED"
          ? "任务已完成。完成任务不会发放植物。"
          : "任务已重新打开。",
      );
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 404)
        void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
  const changeStatus = async (task: TaskRecord) => {
    if (acting.current) return;
    acting.current = true;
    setMessage("");
    try {
      await toggle.mutateAsync(task);
    } catch {
      /* 错误在页面展示。 */
    } finally {
      acting.current = false;
    }
  };
  const noRows =
    !!query.data &&
    !query.isPlaceholderData &&
    !query.isFetching &&
    !query.isError &&
    query.data.records.length === 0;
  useEffect(() => {
    if (!noRows || page <= 1) return;
    const timer = window.setTimeout(
      () => setPage((current) => Math.max(1, current - 1)),
      0,
    );
    return () => clearTimeout(timer);
  }, [noRows, page]);
  const searchTasks = (event: FormEvent) => {
    event.preventDefault();
    setTitle(search.trim());
    setPage(1);
    toggle.reset();
    setMessage("");
  };
  const saved = (created: boolean) => {
    if (created) {
      setStatus(undefined);
      setTitle("");
      setSearch("");
      setPage(1);
    }
    setMessage(created ? "任务已创建，尚未开始专注。" : "任务修改已保存。");
  };
  const stats = [
    {
      title: "任务总数",
      value: totals.all.isError ? "—" : (totals.all.data?.total ?? "—"),
      unit: "个任务",
      icon: ListTodo,
      color: "olive",
      note: "所有任务，含历史计划",
    },
    {
      title: "已完成任务",
      value: totals.completed.isError
        ? "—"
        : (totals.completed.data?.total ?? "—"),
      unit: "个任务",
      icon: ClipboardCheck,
      color: "ochre",
      note: "按任务状态统计",
    },
    {
      title: "专注时长",
      value: "—",
      unit: "分钟",
      icon: Clock3,
      color: "terracotta",
      note: "专注接口尚未开放",
    },
  ];
  return (
    <>
      <PageHeading
        title="今日任务"
        eyebrow={`${date} · 今天也为自己留一点时间`}
        description="把想做的事，种进今天的花园。未完成的计划会持续保留。"
        action={
          <Button
            onClick={() => {
              setEditing("new");
              toggle.reset();
              setMessage("");
            }}
          >
            <Plus size={18} />
            新建任务
          </Button>
        }
      />
      <section className="fg-statistics" aria-label="任务统计">
        {stats.map(({ title, value, unit, icon: Icon, color, note }) => (
          <article className="fg-card fg-statistic" key={title}>
            <span className={`fg-stat-art ${color}`}>
              <Icon size={30} aria-hidden="true" />
            </span>
            <div>
              <h2>{title}</h2>
              <p>
                <strong>{value}</strong>
                <span>{unit}</span>
              </p>
            </div>
            <span className="fg-stat-caption">{note}</span>
          </article>
        ))}
      </section>
      {(totals.all.isError || totals.completed.isError) && (
        <div className="fg-task-notice" role="alert">
          任务统计暂时无法读取。
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void totals.all.refetch();
              void totals.completed.refetch();
            }}
          >
            重试统计
          </Button>
        </div>
      )}
      {message && (
        <p className="fg-task-success" role="status">
          {message}
        </p>
      )}
      {toggle.error && (
        <div className="fg-task-error" role="alert">
          {errorMessage(toggle.error)}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toggle.reset();
              void query.refetch();
            }}
          >
            刷新列表
          </Button>
        </div>
      )}
      <div className="fg-task-workspace">
        <section className="fg-card fg-tasks-panel">
          <div className="fg-section-heading">
            <div>
              <h2>
                <ListTodo size={21} aria-hidden="true" />
                我的任务
              </h2>
              <p>修改计划只影响后续专注，完成任务不会自动奖励植物。</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="刷新任务列表"
              disabled={query.isFetching}
              onClick={() =>
                void queryClient.invalidateQueries({ queryKey: taskKeys.all })
              }
            >
              <RefreshCw
                size={17}
                className={query.isFetching ? "animate-spin" : ""}
              />
            </Button>
          </div>
          <div className="fg-task-toolbar">
            <div className="fg-task-filters" aria-label="任务状态筛选">
              {filters.map((filter) => (
                <Button
                  key={filter.label}
                  variant={status === filter.status ? "default" : "outline"}
                  size="sm"
                  aria-pressed={status === filter.status}
                  onClick={() => {
                    setStatus(filter.status);
                    setPage(1);
                    toggle.reset();
                    setMessage("");
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <form
              onSubmit={searchTasks}
              className="fg-task-search"
              role="search"
            >
              <Input
                aria-label="搜索任务名称"
                maxLength={100}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索任务名称…"
              />
              <Button
                type="submit"
                variant="outline"
                size="icon"
                aria-label="搜索任务"
              >
                <Search size={17} />
              </Button>
            </form>
          </div>
          {query.isPending ? (
            <div className="fg-task-loading" role="status">
              <LoaderCircle size={22} className="animate-spin" />
              正在读取任务…
            </div>
          ) : query.isError ? (
            <div className="fg-task-load-error">
              <p role="alert">{errorMessage(query.error)}</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                重新加载任务
              </Button>
            </div>
          ) : (
            <>
              <div className="fg-task-results" aria-busy={query.isFetching}>
                <span className="fg-task-result-caption">
                  共 {query.data.total} 个匹配任务
                  {query.isFetching ? " · 更新中…" : ""}
                </span>
                {query.data.records.length ? (
                  query.data.records.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      busy={toggle.isPending || query.isPlaceholderData}
                      onToggle={() => void changeStatus(task)}
                      onEdit={() => {
                        queryClient.removeQueries({
                          queryKey: taskKeys.detail(task.id),
                        });
                        setEditing(task.id);
                        setMessage("");
                        toggle.reset();
                      }}
                      onDelete={() => {
                        setDeleting(task);
                        setMessage("");
                        toggle.reset();
                      }}
                    />
                  ))
                ) : (
                  <div className="fg-task-empty">
                    <span className="fg-empty-illustration">
                      <Sprout size={35} />
                    </span>
                    <h3>
                      {title || status ? "还没有匹配的任务" : "从一件小事开始"}
                    </h3>
                    <p>
                      {title || status
                        ? "试试其他关键词或状态，或种下一份新的计划。"
                        : "写下想做的事，为重要的事情留一点时间。"}
                    </p>
                    <Button variant="outline" onClick={() => setEditing("new")}>
                      <Plus size={16} />
                      创建第一个任务
                    </Button>
                  </div>
                )}
              </div>
              <div className="fg-task-pagination">
                <span>
                  第 {page} / {Math.max(1, Math.ceil(query.data.total / 10))} 页
                </span>
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1 || query.isFetching}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    <ChevronLeft size={15} />
                    上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={query.isFetching || page * 10 >= query.data.total}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    下一页
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
        <aside className="fg-card fg-garden-panel fg-task-garden-aside">
          <div className="fg-section-heading">
            <div>
              <h2>
                <Sprout size={21} />
                我的专注花园
              </h2>
              <p>专注与植物收获功能即将接入。</p>
            </div>
          </div>
          <GardenScene />
          <p className="fg-task-service-boundary">
            每一份认真都值得记录。专注与植物收获功能正在准备中，敬请期待。
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/collection">
              植物收藏
              <ArrowUpRight size={15} />
            </Link>
          </Button>
        </aside>
      </div>
      {editing && (
        <TaskEditorDialog
          taskId={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
      {deleting && (
        <TaskDeleteDialog
          task={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() =>
            setMessage("任务已删除。已有专注记录与植物不会因任务删除而改变。")
          }
        />
      )}
    </>
  );
};

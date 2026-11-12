> 更新：任务模块现已按 [后端实际任务契约](../../focus-garden-server/docs/api/task-api.md) 接入，代码位于 `src/services/tasks/`。实际修改方法是 **PUT**，状态为 TODO/IN_PROGRESS/COMPLETED，标题/描述/时长上限为 100/2000/1440；任务接口不再以本文早期建议为准。下文仅保留未实现模块的规划参考，不能据此请求尚不存在的专注、植物、设置接口。

# Spring Boot 对接建议契约（待确认）

本文仅为前端所需能力的建议，不表示后端已经存在任何接口。当前仅 `GardenService` 的本地模拟实现参与运行，所有路径、DTO、认证和错误码须在接入时确认。

## 前端模型

权威定义：`src/types/index.ts`。毫秒时间戳由 HTTP adapter 与后端时间格式（建议 ISO 8601 含偏移量）转换。时长使用 `plannedMinutes`（整数分钟）和 `actualMs`（毫秒），避免单位混淆。

任务字段：id、title、notes、plannedMinutes（1–180）、plantType、status、createdAt、completedAt。

专注字段：id、taskId、taskTitle（快照）、plantType（快照）、plannedMinutes（快照）、actualMs、status、startedAt、endedAt、resumedAt、breakEndsAt。

奖励植物：id、type、sessionId、obtainedAt。名称与说明当前由前端静态目录提供；后端可返回植物目录，此时在 adapter 中归一。

设置：focusMinutes（1–180）、breakMinutes（1–60）、soundEnabled。

任务状态：`pending | completed`；专注状态：`running | paused | completed | abandoned`。持久化阶段不可混为一个状态。

## 建议 REST 能力

| 方法与路径（建议）                   | 请求           | 结果/规则                                        |
| ------------------------------------ | -------------- | ------------------------------------------------ |
| GET /tasks                           | 可选 status    | Task[]，未完成任务跨日期保留                     |
| POST /tasks                          | TaskInput      | Task；trim 后校验标题 1–100 字，备注最多 1000 字 |
| PATCH /tasks/{id}                    | TaskInput      | Task；活跃轮次快照不受影响                       |
| DELETE /tasks/{id}                   | 无             | 活跃任务返回冲突；已结束的记录/奖励保留          |
| POST /tasks/{id}/complete            | 无             | Task；活跃时拒绝；幂等完成任务                   |
| GET /focus-sessions                  | 日期范围、时区 | FocusSession[]；含完成、放弃与活跃状态           |
| GET /focus-sessions/active           | 无             | 唯一活跃 FocusSession 或 null                    |
| POST /focus-sessions                 | taskId、幂等键 | 新记录或明确返回已有活跃记录                     |
| GET /focus-sessions/{id}             | 无             | FocusSession，服务端权威时间                     |
| POST /focus-sessions/{id}/pause      | 幂等键         | 更新实际时长、清空 resumedAt                     |
| POST /focus-sessions/{id}/resume     | 幂等键         | 恢复运行片段起点                                 |
| POST /focus-sessions/{id}/complete   | 幂等键         | 到点后结算；返回记录与唯一奖励                   |
| POST /focus-sessions/{id}/abandon    | 幂等键         | 保存实际时间，不发奖励                           |
| POST /focus-sessions/{id}/break      | 无或幂等键     | 开始休息并返回固定 breakEndsAt                   |
| POST /focus-sessions/{id}/skip-break | 无或幂等键     | 截止时间改为当前服务端时间                       |
| GET /plants                          | 可选分页       | Plant[]，每株含来源 sessionId                    |
| GET /settings                        | 无             | UserSettings                                     |
| PUT /settings                        | UserSettings   | 校验、保存并返回设置                             |

当前 `GardenService.read()` 返回 `GardenData` 聚合快照。HTTP adapter 可协调上述资源调用，或在双方同意后使用聚合读取接口；不要求 Spring Boot 必须按浏览器 localStorage 的聚合模型存储。当前 mutation 返回快照的约定也可由 adapter 重新读取组成。`sessionAction('complete')` 在模拟实现中只触发统一的到点校准，不支持提前领取植物。

## 一致性与错误约定

- 用户身份由服务端认证上下文决定，认证方式待定，不接受任意客户端 userId 作为授权依据。
- 单活跃记录限制必须在事务/并发约束内实现，包括暂停记录；多端同时点击也只能创建一个。
- 结算原子更新记录并插入植物，`plants.session_id` 唯一约束；重复请求返回同一结果。后端以服务器时间校验结束条件，不信任客户端实际时长或奖励声明。
- 完成任务与完成一轮专注分开处理。状态转换需锁定/版本控制，避免暂停、放弃与结算之间的竞争。
- 业务冲突建议 HTTP 409，参数错误 400/422，记录不存在 404；建议返回 `{ code, message }`，字段校验错误结构另行确认。
- 可额外返回 serverTime 以校准客户端时钟偏差；本地模拟受设备时间修改影响。
- 列表分页、时区、跨日归档、累计统计口径需要确认。当前以前端本地结束日期整轮归档，放弃记录也计入投入时长；休息不计入。
- 后端自行推进到点完成，或在读取/结算时兜底校准，保证客户端关闭后仍可恢复完成状态。
- Spring Boot 开发环境需允许前端 origin 的 CORS；生产同域反向代理可使用 `/api`。认证采用 Cookie 时再明确 CSRF 与 withCredentials 配置。

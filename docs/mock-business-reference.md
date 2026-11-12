> 阶段说明：以下记录此前的模拟业务实现。当前第二步路由挂载的是布局骨架，本文描述的业务页面尚未重新接入，请以根目录 README 为准。

# 专注花园

Vite + React + TypeScript 的可交互前端。新建任务 → 开始专注 → 完成一轮 → 获得植物 → 继续专注或完成任务。当前为独立运行的本地模拟版本，未连接 Spring Boot，未实现认证。

没有收到设计稿，当前采用绿色、暖白、圆角卡片和本地 SVG 植物的基础视觉风格。空花园插画标注为成长预览，统计从真实保存记录计算，初始值均为零。

## 运行

Node.js **20.19+**（也支持当前 LTS），pnpm **10.34.9**。项目在 `focus-garden-client`，已有的兄弟目录 `focus-garden-server` 未修改。

```sh
cd focus-garden-client
corepack enable
pnpm install
pnpm dev
```

默认打开 http://localhost:5173 。若本机 shell 没有 Node/pnpm，请先激活已安装的 Node（例如 `fnm use 20` 或 `nvm use 20`），也可用 `corepack pnpm` 替代 `pnpm`。

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
```

浏览器回归（桌面 Chromium / 手机尺寸 Chromium）：

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

浏览器测试自动启动/关闭开发服务器。测试通过虚拟时钟验证完整专注流程，无需实际等待一分钟。截图和失败 trace 在被 Git 忽略的 `test-results/` 中。手机测试是设备尺寸与触控模拟，未声称经过 iOS Safari 真机验证。

## 目录与责任

- `src/pages/`：首页、专注、成长记录、收藏、设置页面；路由定义在 `src/App.tsx`。
- `src/layouts/GardenLayout.tsx`：桌面侧栏、手机底栏、全局加载与错误反馈。
- `src/components/ui/`：shadcn CLI 生成并适配的 Button / Input / Textarea / Dialog / Switch；Dialog 支持滚动与焦点管理。
- `src/features/tasks/`：任务表单。
- `src/features/focus/`：纯计时与结算逻辑、提示音。
- `src/features/garden/`：植物目录、四阶段 SVG 植物。
- `src/hooks/`：异步数据入口、展示时钟与全局生命周期。
- `src/types/index.ts`：Task / FocusSession / Plant / UserSettings 和 service 契约。
- `src/services/`：模拟实现、持久化适配、Axios 实例及后续实现切换入口。

Tailwind 使用官方 Vite 插件；`@` 在 Vite 和 TypeScript 中同时指向 `src`。基础组件使用 shadcn/ui 与 Radix。数据跨页面同步目前由一个 React Context 处理；尚未接真实服务端，不提前安装 TanStack Query 或 Zustand。

## 模拟数据与计时规则

所有业务通过 `gardenService` 异步访问。数据集中存入 `localStorage['focus-garden:v1']`，包括任务、专注记录、奖励植物、设置和休息截止时间。无样例任务、无虚构统计。存储解析、校验与写入错误都集中处理；损坏的数据不会被静默覆盖。清除浏览器站点数据会删除本地花园；不支持跨设备同步。

- 任务仅有 `pending/completed`。专注独立使用 `running/paused/completed/abandoned`，任务可以完成多轮专注。
- `actualMs` 保存已完成运行片段的毫秒数，`resumedAt` 保存当前运行片段起点。剩余时间由时间戳计算，定时器只刷新展示/触发校准，不递减持久化计数。
- 暂停后 `resumedAt=null`，暂停时间不累计。重载、切换页面、后台回来都会按保存的时间戳恢复。
- 到点自动结算；后台很久后恢复，结束时间仍记录为实际到点时间。结算以 sessionId 去重，植物 ID 与记录绑定；已完成记录无法再获奖励。
- 开始时若已有活跃记录，返回该记录并导航至原专注。活跃任务禁止删除/完成，页面提供返回专注入口。
- 放弃保留投入时间，永远不发完成奖励。任务删除后，历史记录用任务名/植物类型快照继续展示。
- 浏览器支持 Web Locks 时，写操作在多标签页之间串行；`storage` 事件同步页面。不支持 Web Locks 的浏览器仅保证单标签页内串行，正式跨设备一致性应交由后端事务保障。
- 默认专注时长用于新任务的计划值；每轮专注从任务计划值生成不可变时长快照。设置修改不会改变已有任务、活跃专注或已开始的休息；任务编辑后的计划仅用于下一轮。
- 休息使用持久化截止时间，不算专注，不自动开始下一轮；可跳过。
- 日期使用用户本地日历。记录按结束日期归档，未结束的按开始日期；统计采用相同归档规则，放弃记录的实际投入也计入时长。跨午夜的单轮整体归入该归档日期，当前不做逐分钟跨日拆分。
- 提示音需浏览器用户手势授权。设置中可测试；刷新后如被拦截，界面会提示，倒计时与结算继续工作。

## 环境变量与后端接入

```sh
cp .env.example .env
```

`VITE_API_BASE_URL=http://localhost:8080/api` 用于 `src/services/http.ts` 的 Axios 实例。超时与网络/HTTP 错误在这里统一转换；环境变量只包含前端可公开配置，不放密钥。**设置此变量不会切换到真实 API**，模拟模式仍可独立运行。

建议对接步骤：

1. 与 Spring Boot 确认 [docs/api-contract.md](docs/api-contract.md) 的建议契约。
2. 新增 `src/services/http-adapter.ts`，用 Axios 实现同一个 `GardenService`，在边界映射 DTO、枚举、时间单位与错误码。
3. 在 `src/services/index.ts` 替换实现；组件不直接调用 Axios。认证方案确认后再统一补充，当前不猜测 token 或登录接口。
4. 接入时引入 TanStack Query，以资源查询和 mutation 失效机制替代当前 Context 快照刷新；计时继续由时间戳推导。
5. 服务端用事务保证单活跃记录、结算幂等和奖励唯一约束，不能依赖客户端去重。

生产静态托管需要为 `/focus/*`、`/records` 等路径配置 SPA fallback 到 `index.html`。本次仅交付本地源码与构建产物，不部署服务。

## 参考配置

安装配置依据 [Tailwind Vite 文档](https://tailwindcss.com/docs/installation/using-vite)、[shadcn/ui Vite 文档](https://ui.shadcn.com/docs/installation/vite)、[React Router 声明式路由文档](https://reactrouter.com/start/declarative/installation)。依赖准确版本由 `pnpm-lock.yaml` 锁定。

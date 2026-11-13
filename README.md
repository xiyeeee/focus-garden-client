# 专注花园

自动测试、推送阿里云镜像和SSH发布配置见 [GitHub Actions部署说明](docs/deployment/github-actions.md)。需在仓库配置ACR和SSH Secrets后才能部署。

Vite + React + TypeScript 前端，沿用奶油色、鼠尾草绿、衬线标题与圆角卡片。**任务页现已对接 Spring Boot 任务 API**，具备新增、编辑、删除、完成/重新打开、名称搜索、三态筛选与分页。专注、成长记录和收藏仍是骨架；设置页仅保留退出登录。用户名/邮箱登录、Session 恢复、退出、注册、验证码及密码重置均已按后端实际契约接入。未登录先进入登录页，登录成功后进入首页。

## 启动

Node.js 20.19+、pnpm 10.34.9：

```sh
cd focus-garden-client
corepack enable
pnpm install
pnpm dev
```

打开 http://localhost:5173 ，未登录会自动跳转到 `/login`。没有 pnpm shim 时可用 `corepack pnpm dev`；shell 没有 Node 时先执行 `nvm use 20` 或 `fnm use 20`。

默认 Axios 使用 `/api`，Vite 开发服务器代理到 `http://127.0.0.1:8080`。任务数据源仍为 HTTP，不自动降级模拟数据。任务请求仅在会话验证通过、业务页面挂载后发起；认证会话通过真实 `/api/users/me` 确认，未登录不请求任务，也不伪造会话。

后端需按 [后端启动文档](../focus-garden-server/docs/api/task-api.md) 配置 MySQL、环境变量并启动。后端启动会读取其自身的数据库配置；前端不需要数据库账号密码。当前后端采用 Session Cookie + CSRF，任务需要登录且按用户归属查询。认证运行环境、SMTP 和 Session 表迁移见 [认证接口文档](../focus-garden-server/docs/api/auth-api.md)。

## 环境变量

```sh
cp .env.example .env
```

```dotenv
VITE_API_BASE_URL=/api
```

如果前后端分离部署，可以改为完整 API 地址，例如 `http://localhost:8080/api`；此时需在后端 `CORS_ALLOWED_ORIGINS` 配置浏览器的真实源。当前后端默认只允许 `http://localhost:5173`，默认开发代理会将前端同源请求的 Origin 对齐上游，localhost:5173 和 127.0.0.1:5173 均可使用；跨源直连仍需后端允许真实浏览器源。

`VITE_` 变量会公开给浏览器，不能填数据库密码或密钥。环境变量修改后需重启 Vite。Vite 的开发代理**不适用于静态生产部署**，生产需配置 `/api` 反向代理或完整 API 地址；页面路径仍需 SPA fallback 到 `index.html`。

## 接口与代码

权威契约：[focus-garden-server/docs/api/task-api.md](../focus-garden-server/docs/api/task-api.md)。本次也核对了实际 `TaskController`、DTO 和 Service。

| 能力              | 实际接口                      |
| ----------------- | ----------------------------- |
| 分页查询          | GET /api/tasks                |
| 读取详情          | GET /api/tasks/{id}           |
| 新增              | POST /api/tasks               |
| 完整修改/重新打开 | PUT /api/tasks/{id}           |
| 删除              | DELETE /api/tasks/{id}        |
| 完成任务          | POST /api/tasks/{id}/complete |

- `src/services/http.ts`：Axios 实例、共享内存 CSRF 与统一 `ApiError`，携带 Cookie，保留 HTTP status/code/message/Retry-After；请求取消不转换为业务错误。
- `src/services/tasks/types.ts`：从后端交付文档同步的 DTO/VO/分页/统一响应类型。
- `src/services/tasks/adapter.ts`：`description ↔ notes`、`plannedFocusMinutes ↔ plannedMinutes`、UTC ISO 时间转换；ID 全程保持字符串。
- `src/services/tasks/api.ts`：六个接口请求、响应解包与结构校验。只发送契约允许的字段。
- `src/features/tasks/task-model.ts`：任务资源的页面模型，保留 TODO/IN_PROGRESS/COMPLETED 三态。
- `src/features/tasks/queries.ts` / `src/lib/query-client.ts`：TanStack Query 的列表/详情键、缓存、取消与 mutation 后失效。
- `src/features/tasks/TaskEditorDialog.tsx`：读取最新详情后编辑，字段校验、保存中、服务端错误与输入保留。
- `src/features/tasks/TaskDeleteDialog.tsx` / `TaskRow.tsx`：删除确认、完成/重新打开与更多菜单。
- `src/pages/TasksPage.tsx`：当前首页任务列表与搜索、筛选、分页。按路由延迟加载。
- `src/layouts/`、`src/components/layout/`、`src/index.css`：沿用公共布局、手机抽屉、主题变量与独立滚动。

## 契约与交互边界

- 后端 Task ID 是 BIGINT 的十进制字符串，不做 `Number/parseInt` 转换。
- 创建显式提交 TODO；普通编辑回传原始三态，避免把 IN_PROGRESS 降为 TODO；重新打开才主动提交 TODO。
- PUT 是完整替换，始终回传 title、description、plannedFocusMinutes、plantType、status，不发送 id/时间戳/deleted/userId。
- 按已实现后端契约校验：标题原始长度不超过 100 字、trim 后非空；描述最多 2000 字且保留空白；分钟数为 1–1440 整数。与早期设计说明不同的上限以此次确认的后端契约为准。
- 完成按钮只完成整个任务，不创建专注记录、不发植物。专注按钮明确禁用。
- 查询按 page/size/total 分页，状态筛选保留全部/待开始/进行中/已完成，避免漏掉 IN_PROGRESS。
- 任务总数和已完成任务数量分别取接口分页 total，是全量任务口径，不是当日统计；专注时长显示 `—`，不虚构记录。
- 创建成功清除筛选并回第一页；修改、完成、删除后使查询失效。删除末页最后一条后回退一页。
- 列表有加载/空数据/错误重试；保存失败保留输入。404 会刷新列表，失效的详情会显示错误。
- Query 对读取最多自动重试一次，4xx 不重试。新增、编辑、删除、完成等 mutation **均不自动重试**；保存超时提示先刷新核对，避免重复创建。
- 后端 PUT 为后写覆盖，未提供版本检测；前端编辑前读取最新详情，但不能替代服务端并发版本控制。
- 未挂载旧 `GardenProvider`，真实任务不写入 mock localStorage，也不与本地模拟专注记录混用。没有自动上传或迁移旧任务。

已实机确认真实后端的 CSRF 200、匿名 me 401、HttpOnly Cookie 与可提交的登录表单，两个本地开发地址均可联调。真实账号/邮件/数据库完整联调仍需收信环境；本轮未创建真实账号或发送真实验证码邮件。

## 路由与素材

`/login`、`/register`、`/forgot-password` 为公开认证页；`/` 为登录后的任务页；`/records`、`/collection` 是公共布局内的骨架；`/settings` 仅提供退出登录；`/focus/:sessionId` 使用独立简洁布局（可预览 `/focus/layout-preview`）；其余路径为 404。

桌面固定侧栏、主内容独立滚动；手机抽屉支持关闭、Escape、焦点恢复和选中路由高亮。已覆盖 320px、平板与桌面尺寸。

设计 ZIP 位于 `public/design/focus-garden-designs (1).zip`，已查看包含登录页在内的全部 16 张图；未将整张设计稿当页面背景。`src/components/garden/` 与 `src/config/visual-assets.ts` 预留独立素材路径，`public/images/` 包含登录页的独立透明 3D 花园插画，其余场景暂保留 SVG 占位。Vite 会把 `public/design/` 原样复制到构建产物，发布前可按素材交付策略调整。

旧模拟业务代码与测试仍保留，当前不挂载；其说明见 [旧业务实现参考](docs/mock-business-reference.md)，对应样式 `src/styles/business-reference.css` 不加载。

## 登录页预览

访问 http://127.0.0.1:5173/ 会自动进入登录页。登录页没有返回首页入口，品牌为静态标识；登录后的顶部头像进入账号设置。按新增的第 16 张设计稿实现独立双栏布局；手机端优先展示表单，插画在下方。登录稿中的花园已作为独立透明 3D 素材实现，文字/按钮/表单均为代码。

登录默认使用用户名和密码，可切换邮箱；按后端规则校验用户名/邮箱，密码原样发送。用户名账号邮箱允许为空；用户名账号暂不支持邮箱找回密码。邮箱注册与找回密码成功后回到邮箱登录。登录成功进入首页，注册成功回登录，密码重置使旧会话失效；设置页仅保留退出登录。Cookie 由浏览器管理，CSRF 仅在内存；任务写操作同样携带 CSRF。没有 localStorage 标记或 URL 参数登录绕过入口。

注册/找回密码使用后端邮件验证码，需先配置真实 SMTP 或其文档中的本地 Mailpit。页面不提供默认账号，也不会假装发送成功。详细请求顺序、限流处理、部署配置及代码入口见 [认证对接说明](docs/auth-integration.md)。

文件位置、素材来源、生成提示词和详细边界见 [登录页设计说明](docs/login-design.md)。

## 验证

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

单元测试覆盖请求方法/路径/body、错误码、分页、字符串大 ID、三态映射和旧模拟计时逻辑。浏览器测试覆盖任务 CRUD、完成/重新打开、分页筛选、空白校验、保存失败与防重复提交、404、列表重试，以及既有路由/抽屉/响应式布局。

业务及认证测试仅拦截真实 HTTP 路径，运行实际 Axios/CSRF/认证适配代码，不再替换认证源码模块。覆盖未登录拦截、注册/密码重置、发码失败、限流、CSRF 失效、登录/退出、会话验证和缓存清理。Vitest 使用兼容 Node 20 的 4.1 版本。

浏览器测试通过 Playwright 拦截接口，模拟的是后端实际响应契约，**不是浏览器 localStorage 业务降级，也不等于真实数据库联调**。测试自动启动/关闭 Vite；截图和失败 trace 输出到忽略目录 `test-results/`。手机为 Chromium 尺寸与触控模拟，未声称 iOS Safari 真机验证。

TanStack Query 配置参考 [官方查询与 mutation 文档](https://tanstack.com/query/latest/docs/framework/react/quick-start)，分页保留旧数据参考 [官方分页文档](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)。

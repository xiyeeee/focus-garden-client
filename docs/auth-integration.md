# 用户认证接口对接

新增用户名契约：[username-auth-api.md](../../focus-garden-server/docs/api/username-auth-api.md)。登录默认使用用户名，可切换邮箱；两种方式共用原 Session/CSRF。注册页面仍使用邮箱验证码流程，注册/重置成功后返回邮箱登录模式，普通首次访问默认用户名。用户名注册的 service/DTO 已同步，本阶段未扩展注册页面。

权威契约：兄弟项目 [auth-api.md](../../focus-garden-server/docs/api/auth-api.md)，同时核对了 AuthController、SecurityConfig、WebConfig 和请求 DTO。后端已经采用 Spring Security + Spring Session JDBC + SMTP，前端不使用 JWT 或浏览器存储里的“已登录”标记。

## 已接入能力

| 页面/能力             | 方法与路径                    |
| --------------------- | ----------------------------- |
| 内存 CSRF 初始化/刷新 | GET /api/auth/csrf            |
| 会话恢复              | GET /api/users/me             |
| 用户名/邮箱密码登录          | POST /api/auth/login          |
| 退出当前会话          | POST /api/auth/logout         |
| 邮箱验证码            | POST /api/auth/email-codes    |
| 注册                  | POST /api/auth/register       |
| 重置密码              | POST /api/auth/password/reset |

路由 `/login`、`/register`、`/forgot-password` 为公开认证页面；首页、任务、成长记录、收藏、设置和专注均需会话验证通过。设置仍然仅保留退出登录。登录页无返回首页入口；注册成功回登录，不自动进入花园；重置成功清理前端会话后回登录。

没有默认账号，没有测试登录按钮。先通过注册页面申请邮件验证码，注册后再登录；邮件服务必须由后端正确配置。

## 请求顺序与状态

- 全站 Axios 使用 `withCredentials=true`；HttpOnly `GARDEN_SESSION` Cookie 由浏览器管理，前端不读取、不序列化、不保存其值。
- 第一次进入/页面刷新：获取 CSRF → 查询 me。me 返回 401 时按未登录处理；网络或 503 不伪装为未登录，显示验证失败与重试。
- CSRF token 仅在 `src/services/http.ts` 的内存管理器中保存。所有 POST/PUT/DELETE（含任务操作）共用同一实例，自动携带响应指定的 X-CSRF-TOKEN。
- 登录成功：轮换会话版本 → 重新获取 CSRF → 更新用户状态和任务缓存。如果登录 POST 已成功、后续 CSRF 刷新失败，查询 me 确认已登录，不重新发送登录 POST，也不误报密码错误；后续写请求重新取得 token。
- 退出和重置成功：清除旧 CSRF、刷新 token。若刷新暂时失败，保持“退出/重置已成功”的真实结果，下次写请求再取 token。
- 业务请求 401：清除用户、任务查询和 mutation 缓存，回登录；me 初次 401 与登录 INVALID_CREDENTIALS 不触发重复的全局过期循环。
- 403 CSRF_INVALID：重新获取 CSRF 并提示用户重试，不自动重放写请求。输入保留。
- 429 RATE_LIMITED：读取 Retry-After 秒数，按钮禁用并按时间戳倒计时。写请求不自动重试。
- 发码成功后等待 60 秒；服务端邮件错误不会显示“发送成功”。SMTP 失败也消耗限额，UI 保留输入并限制连续发送。
- 并发写请求共用正在获取的 CSRF；会话切换后旧 token 请求不能覆盖新 token。请求带内存会话代际，过期的旧响应不会进入新账号缓存。
- 浏览器重新聚焦/恢复网络会重新验证会话，避免长期沿用缓存身份。

## 表单契约

用户名 trim 转小写，3–32 位 ASCII 字母、数字或下划线且字母开头；username/email 联合类型保证身份二选一，请求省略另一身份。UserVO.email 与 username 均允许 null，但至少有一种身份。用户名账号暂不支持邮箱找回密码，仅邮箱模式提供找回入口。切换方式保留各自输入，清空错误，但不清除限流。

邮箱 trim 后转小写，支持 ASCII 邮箱，最多 254 字符；不移除加号或点。密码与新密码为 8–128 个 UTF-16 字符，支持 Unicode 和空格，原样提交，不 trim、不截断。

验证码为 6 位 ASCII 数字字符串，保留 `012345` 等前导零。注册发码使用 REGISTER，重置发码使用 RESET_PASSWORD。昵称为选填，最多 30 字符；确认密码仅在前端校验，不发送后端。每个请求只发送 DTO 规定字段。

注册邮箱冲突、验证码错误、参数错误、限流与邮件失败显示服务端信息，不解析中文 message 决定业务逻辑。所有账号相关表单使用 ref + disabled 防重复提交；验证码、密码及邮箱不写入 localStorage/sessionStorage。

## 代码位置

- `src/services/auth/types.ts`：从后端交付文件同步的 DTO/VO。
- `src/services/auth/api.ts`：7 个实际认证资源接口及会话轮换。
- `src/services/auth.ts`：既有 AuthService 适配入口，现已连接真实 API。
- `src/services/http.ts` / `csrf.ts`：共享 Cookie、CSRF、ApiError、Retry-After、会话失效通知。
- `src/features/auth/AuthProvider.tsx`：会话查询、登录/退出、缓存清理与过期处理。
- `src/features/auth/AuthLayout.tsx` / `AuthFields.tsx`：认证页面共用布局与字段。
- `src/features/auth/LoginForm.tsx` / `VerificationForm.tsx`：登录、注册、找回密码表单。
- `src/hooks/useCooldown.ts`：限流与验证码等待时长的时间戳计算。

## 开发与部署

前端默认 `VITE_API_BASE_URL=/api`，由 Vite 代理至 `http://127.0.0.1:8080`。开发代理仅对 Origin 与前端请求 Host 相同的同源请求，将 Origin 对齐上游目标；`localhost:5173` 和 `127.0.0.1:5173` 均可使用，外部 Origin 不重写。此配置依据 [Vite server.proxy](https://vite.dev/config/server-options#server-proxy) 的 configure/proxyReq 扩展，仅作用于本地开发。跨源直连必须启用凭据并允许 X-CSRF-TOKEN，不能使用 CORS 通配符。

生产优先同源反向代理，HTTPS + Secure Cookie；跨站部署不在默认 SameSite=Lax 方案范围。不要在前端 .env 填数据库、SMTP 密码或 HMAC 密钥。后端 SMTP/MySQL/Session 表配置与本地 Mailpit 收信步骤以其文档为准。

## 验证边界

单元测试模拟 Axios adapter，验证真实请求方法、Cookie/CSRF 配置、登录后的 token 轮换、CSRF 失效不重放、限流读取、前导零与密码空格保留、并发和旧会话响应。

Playwright 仅拦截实际 HTTP 路径 `/api/auth/*`、`/api/users/me` 和任务接口；浏览器运行生产使用的 Axios/认证代码，不再替换认证源码模块。覆盖注册/重置/登录/退出、错误与限流、会话过期、前端缓存隔离和任务写请求的 CSRF。

已实机使用真实后端与浏览器确认：localhost/127.0.0.1 的开发代理获取 CSRF 均为 200、匿名 me 为 401、会话 Cookie 为 HttpOnly、登录表单可提交，浏览器存储未保存认证信息；不相关外部 Origin 仍返回 403。

TypeScript、ESLint、生产构建通过，39 项单元测试与 50 项桌面/手机浏览器回归通过。

拦截式测试不等于真实账号/邮件/数据库验证。本轮没有创建真实用户、发送真实验证码邮件或使用用户的密码；需要后端服务与收信环境就绪后人工验证完整邮件链路。

测试工具已调整为兼容项目 Node 20.19+、Vite 8 的 Vitest 4.1；原 Vitest 5 要求 Node 22.12+，在 Node 20 上报告失败测试时会异常。

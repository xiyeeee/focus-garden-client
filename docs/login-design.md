# 登录页布局与素材

## 页面与交互边界

设计来源：`public/design/focus-garden-designs (1).zip` 中 `16-登录页.png`。已提取并查看新稿，之前 15 张图的风格已在公共布局阶段统一。

首次访问 `/` 或任意业务路径会进入 `/login`；登录页没有返回首页入口，品牌也不链接到首页。登录后的头像进入账号设置。布局独立于侧栏与专注流程：桌面左侧为标题、说明和独立花园插画，右侧为登录卡片；800px 及以下切为单栏，表单先展示，插画后展示。背景光晕、文字、表单和按钮均由 CSS/React 实现，没有把整张设计图当页面背景。

当前可用：邮箱必填及格式的失焦反馈、密码必填反馈、密码显示/隐藏、键盘焦点，以及未登录路由跳转。字段提供 label、autocomplete、aria-invalid 和错误说明关联；减少动态效果时关闭萤火微动画。

登录、注册、忘记密码现已接入 [后端实际认证接口](../../focus-garden-server/docs/api/auth-api.md)，认证会话由 HttpOnly Cookie 管理，CSRF 只保存在内存。注册与密码重置复用同一套布局，使用邮件验证码；不保存密码或验证码，不提供模拟登录入口。

`AuthProvider` 负责会话验证、登录/退出与缓存清理；`LoginForm`、`VerificationForm` 处理字段校验、提交中、服务器错误、Retry-After 限流与验证码倒计时。邮箱 trim 转小写，密码原样保留并按 8–128 字符校验。认证协议与字段边界见 [认证对接说明](auth-integration.md)。

## 文件

- `src/pages/LoginPage.tsx`：页面结构与独立布局。
- `src/features/auth/LoginForm.tsx`：纯登录表单与本地展示状态。
- `src/features/auth/login-form.ts`：表单值、提交回调类型与校验。
- `src/features/auth/LoginArtwork.tsx`：独立插画与装饰。
- `src/features/auth/login.css`：与全站共享颜色变量的登录页样式，局部变量限定在登录页。
- `src/config/visual-assets.ts`：素材路径。
- `src/components/layout/HeaderActions.tsx`：已登录页面的头像链接到 `/settings`。
- `public/images/login-garden.png`：新增独立透明 3D 花园插画，1254×1254 RGBA，约 2.2MB，保留 alpha 通道。

`RequireAuth` 覆盖首页、记录、收藏、设置、专注及 404。会话验证期间仅显示验证状态；验证失败可重试，不先展示业务内容。设置页仅保留退出登录，退出成功后清理 React Query 业务缓存，不改变旧本地模拟数据。退出失败保留已登录页面并提供错误反馈。后端现在同样要求任务登录与用户归属校验。

## 插画来源与生成提示词

使用 **imagegen 技能的内置 image_gen 工具**，以登录稿为视觉参考生成全新、无文字的独立插画；不是登录截图裁剪或页面合成图。最终素材已复制到工作区 `public/images/login-garden.png`，不依赖本机 `.codex` 中的临时引用。原始生成文件按工具要求保留。

最终提示词：

```text
Use case: stylized-concept. Asset type: a standalone transparent illustration for the LEFT hero of the Focus Garden login webpage. Input image is REFERENCE ONLY for the garden illustration, not an edit target or a UI to reproduce. Generate ONLY the beautiful cozy isometric floating garden island in the reference: small cream cottage with terracotta tiled roof and glowing window, lush sage green trees, a little turquoise pond and short waterfall on the lower left, stepping stone path, small wooden fence, sunflower, lavender, pink blossom tree, seedlings and little flowers. Highly detailed soft 3D clay illustration, warm gentle sunlight, calm inviting healing atmosphere, cream, sage, pale yellow, pastel pink and lavender palette. Keep the complete island, cottage and trees inside the frame with breathing space; broad roughly square composition. Bottom surrounded by a few delicate wisps of cloud. All outside background must be truly transparent, preserve transparent alpha. NO TEXT, no logo, no page background, no login card, no buttons, no labels, no UI, no borders, no watermark. Output is a single independent image asset, not a webpage screenshot.
```

## 验证

登录专项浏览器测试覆盖桌面/手机布局、320px/平板/大屏无溢出、直接刷新、路由约束、邮箱校验与密码切换。认证流程使用真实前端请求实现，由 Playwright 拦截已确认的 HTTP 接口，验证注册、重置、登录、退出、会话过期、CSRF 轮换及限流。

真实账号、SMTP 邮件与数据库持久化仍需实际环境联调；拦截式测试不宣称这些外部行为已完成验证。

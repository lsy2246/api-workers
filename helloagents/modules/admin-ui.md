# admin-ui 模块

## 职责
- 管理台前端展示与操作
- 覆盖渠道、模型、令牌、日志、面板与设置

## 接口定义
- 调用 `/api/*` 管理接口
- 登录后使用 Bearer token

## 行为规范
- Vite 构建静态文件
- 使用 `hono/jsx/dom` + TSX 渲染管理台入口
- 入口文件为 `apps/admin/src/App.tsx`（`main.tsx` 已移除）
- 按 `core/`（类型/常量/API）、`features/`（业务视图 + 布局/登录）组织前端模块
- 样式基于 Tailwind v4（结合全局主题变量）
- 前端状态集中在单页
- 渠道管理采用列表视图，支持分页（默认 10 条），新增/编辑使用弹窗，保留启禁/连通测试操作
- Token 仅本地保存，不回显

## 依赖关系
- `auth` / `channels` / `models` / `tokens` / `usage` / `dashboard` / `settings` 模块

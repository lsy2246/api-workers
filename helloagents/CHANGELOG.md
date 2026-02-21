# 变更日志

## [Unreleased]

### 微调
- **[docs]**: 补充本地开发流程、API 接口与 GitHub Actions 自动部署说明
  - 类型: 微调（无方案包）
  - 文件: README.md:12-272
- **[worker]**: 补齐 admin 静态目录占位以通过 wrangler assets 检查
  - 类型: 微调（无方案包）
  - 文件: apps/ui/dist/.gitkeep
- **[worker]**: 修正 wrangler assets 配置并为非 API 路由回退静态资源
  - 类型: 微调（无方案包）
  - 文件: apps/worker/wrangler.toml:15-19, apps/worker/src/index.ts:114-127
- **[tooling]**: 修复 bun check 脚本名称（移除尾随空格）
  - 类型: 微调（无方案包）
  - 文件: package.json
- **[docs]**: 补充云端部署与本地迁移的区分说明
  - 类型: 微调（无方案包）
  - 文件: README.md
- **[ci]**: 自动部署加入远程 D1 迁移步骤
  - 类型: 微调（无方案包）
  - 文件: .github/workflows/deploy.yml
- **[ci]**: 对齐 CloudPaste 风格的 SPA 自动部署流程与数据库初始化
  - 类型: 微调（无方案包）
  - 文件: .github/workflows/deploy.yml
- **[docs]**: 说明 SPA_DEPLOY 自动部署开关
  - 类型: 微调（无方案包）
  - 文件: README.md
- **[admin-ui]**: 渠道创建移除 ID 字段并校验名称唯一
  - 类型: 微调（无方案包）
  - 文件: apps/ui/src/main.tsx:250-287, 664-829
- **[worker]**: 全局记录收到的请求概要
  - 类型: 微调（无方案包）
  - 文件: apps/worker/src/index.ts
- **[worker]**: base_url 为空时返回空字符串避免崩溃
  - 类型: 微调（无方案包）
  - 文件: apps/worker/src/utils/url.ts
- **[tooling]**: dev 脚本改为 Bun workspace 执行
  - 类型: 微调（无方案包）
  - 文件: package.json
- **[admin-ui]**: 本地开发增加 Vite proxy 解决前后端端口不一致
  - 类型: 微调（无方案包）
  - 文件: apps/ui/vite.config.ts, README.md
- **[worker]**: 补充 wrangler.toml 示例配置占位
  - 类型: 微调（无方案包）
  - 文件: apps/worker/wrangler.toml
- **[admin-ui]**: 渠道 ID 与日志渠道可见，操作反馈更清晰
  - 类型: 微调（无方案包）
  - 文件: apps/ui/src/main.ts
- **[worker]**: 使用日志关联渠道/令牌，base_url 自动纠正
  - 类型: 微调（无方案包）
  - 文件: apps/worker/src/routes/usage.ts, apps/worker/src/routes/channels.ts, apps/worker/src/routes/proxy.ts
- **[worker]**: 渠道 ID 支持自定义，令牌可二次查看
  - 类型: 微调（无方案包）
  - 文件: apps/worker/src/routes/channels.ts, apps/worker/src/routes/tokens.ts, apps/worker/src/db/schema.sql, apps/worker/migrations/0002_add_token_plain.sql
- **[admin-ui]**: 渠道 ID 可录入、令牌查看按钮
  - 类型: 微调（无方案包）
  - 文件: apps/ui/src/main.ts
- **[tests]**: 补充 URL 规范化单测
  - 类型: 微调（无方案包）
  - 文件: tests/worker/url.test.ts
- **[proxy]**: 增加失败轮询重试与相关配置
  - 类型: 微调（无方案包）
  - 文件: apps/worker/src/routes/proxy.ts, apps/worker/src/env.ts, apps/worker/wrangler.toml
- **[docs]**: 更新代理重试与本地配置说明
  - 类型: 微调（无方案包）
  - 文件: README.md, helloagents/modules/proxy.md
- **[worker]**: 放宽路由严格匹配以兼容 `/api/channel/` 尾斜杠
  - 类型: 微调（无方案包）
  - 文件: apps/worker/src/index.ts
- **[worker]**: 新增 `/api/group` 兼容接口并放行鉴权
  - 类型: 微调（无方案包）
  - 文件: apps/worker/src/index.ts, apps/worker/src/routes/newapiGroups.ts, tests/worker/newapi.test.ts
- **[proxy]**: 流式请求自动补 `stream_options.include_usage` 以获取 usage
  - 类型: 微调（无方案包）
  - 文件: apps/worker/src/routes/proxy.ts

## [0.4.8] - 2026-02-21

### 变更
- **[ci]**: 部署流程支持按变更范围选择前端/后端并默认按迁移变更执行
  - 方案: [202602211446_deploy-workflow-auto](archive/2026-02/202602211446_deploy-workflow-auto/)

## [0.4.7] - 2026-02-21

### 变更
- **[tooling]**: UI 目录从 apps/admin 迁移为 apps/ui 并同步配置
  - 方案: [202602211405_rename-admin-ui](archive/2026-02/202602211405_rename-admin-ui/)
- **[ci]**: 部署流程改用 apps/ui 与 api-worker-ui
  - 方案: [202602211405_rename-admin-ui](archive/2026-02/202602211405_rename-admin-ui/)
- **[docs]**: 文档与知识库路径更新为 apps/ui
  - 方案: [202602211405_rename-admin-ui](archive/2026-02/202602211405_rename-admin-ui/)

## [0.4.6] - 2026-02-21

### 变更
- **[tooling]**: 统一工作区包名与脚本为 api-worker / api-worker-ui
  - 方案: [202602161825_rename-api-worker-ui](archive/2026-02/202602161825_rename-api-worker-ui/)
- **[worker]**: Worker 部署名称更新为 api-worker
  - 方案: [202602161825_rename-api-worker-ui](archive/2026-02/202602161825_rename-api-worker-ui/)
- **[docs]**: README 与知识库名称同步为 api-worker / api-worker-ui
  - 方案: [202602161825_rename-api-worker-ui](archive/2026-02/202602161825_rename-api-worker-ui/)

## [0.4.5] - 2026-02-16

### 变更
- **[admin-ui]**: 令牌管理改为列表视图并支持分页弹窗创建
  - 方案: [202602161600_token-list-ui](archive/2026-02/202602161600_token-list-ui/)

## [0.4.4] - 2026-02-16

### 修复
- **[admin-ui]**: 使用日志默认每页 50 条并修正本地时间显示
  - 方案: [202602161433_usage-log-fixes](archive/2026-02/202602161433_usage-log-fixes/)
- **[usage/proxy]**: 使用日志补充首 token 延迟、流式与推理强度记录
  - 方案: [202602161433_usage-log-fixes](archive/2026-02/202602161433_usage-log-fixes/)

## [0.4.3] - 2026-02-16

### 变更
- **[admin-ui]**: 使用日志支持分页与指标拆分展示
  - 方案: [202602161355_usage-view-metrics](archive/2026-02/202602161355_usage-view-metrics/)

## [0.4.2] - 2026-02-16

### 变更
- **[deployment]**: 管理台通过 Worker Static Assets 部署并补齐手动/自动部署流程
  - 方案: [202602161013_worker-assets-deploy](archive/2026-02/202602161013_worker-assets-deploy/)

## [0.4.1] - 2026-02-15

### 变更
- **[admin-ui]**: 管理台入口拆分为模块、扁平化 features，并将 AppShell 调整为 AppLayout
  - 方案: [202602152325_admin-ui-modularize](archive/2026-02/202602152325_admin-ui-modularize/)
  - 决策: admin-ui-modularize#D001(功能域拆分)

## [0.4.0] - 2026-02-15

### 新增
- **[channels]**: New API 标签批量权重/启用/停用接口
  - 方案: [202602152211_newapi-tag-sync](archive/2026-02/202602152211_newapi-tag-sync/)

## [0.3.1] - 2026-02-15

### 修复
- **[proxy]**: 增强 usage 解析以修复使用日志与数据面板 token 统计为 0
  - 方案: [202602151843_fix-usage-tokens](archive/2026-02/202602151843_fix-usage-tokens/)

## [0.3.0] - 2026-02-15

### 变更
- **[admin-ui]**: 管理台改为 Hono + TSX DOM 渲染并接入 Tailwind v4
  - 方案: [202602151628_admin-ui-hono-tsx-tailwind](archive/2026-02/202602151628_admin-ui-hono-tsx-tailwind/)
  - 决策: admin-ui-hono-tsx-tailwind#D001(采用 Hono JSX DOM + Tailwind)

## [0.2.1] - 2026-02-15

### 变更
- **[tooling]**: 切换为 Bun 作为包管理器，补充部署说明与 fix 命令
  - 方案: [202602150153_bun-tooling](archive/2026-02/202602150153_bun-tooling/)

## [0.2.0] - 2026-02-15

### 新增
- **[channels/auth/models]**: 新增 New API 兼容渠道管理接口、用户模型接口与管理员令牌鉴权
  - 方案: [202602150127_newapi-channel-compat](archive/2026-02/202602150127_newapi-channel-compat/)
  - 决策: newapi-channel-compat#D001(新增兼容层并保留扩展字段)

## [0.1.0] - 2026-02-14

### 新增
- **[核心服务]**: 初始化 Worker + D1 后端与 Vite 管理台，提供渠道/模型/令牌/日志/面板与 OpenAI 兼容代理
  - 方案: [202602142217_new-api-lite](archive/2026-02/202602142217_new-api-lite/)
  - 决策: new-api-lite#D001(单 Worker + Hono), new-api-lite#D002(Vite + Pages), new-api-lite#D003(Token 默认全渠道), new-api-lite#D004(日志保留可配置)

### 修复
- **[{模块名}]**: {修复描述}
  - 方案: [{YYYYMMDDHHMM}_{fix}](archive/{YYYY-MM}/{YYYYMMDDHHMM}_{fix}/)

### 微调
- **[{模块名}]**: {微调描述}
  - 类型: 微调（无方案包）
  - 文件: {文件路径}:{行号范围}

### 回滚
- **[{模块名}]**: 回滚至 {版本/提交}
  - 原因: {回滚原因}
  - 方案: [{原方案包}](archive/{YYYY-MM}/{原方案包}/)



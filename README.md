# new-api-lite

简易版 new-api：Cloudflare Workers + D1 后端，Vite 静态管理台。

## 目录结构

- `apps/worker` Cloudflare Worker (Hono)
- `apps/admin` 管理台 (Vite)
- `tests` 基础单元测试

## 本地开发

### 1) 安装依赖

```bash
bun install
```

### 2) Worker

```bash
bun run dev:worker
```

环境变量（`apps/worker/wrangler.toml` 或 `wrangler secret put`）：

- `CORS_ORIGIN` 允许的管理台来源
- `PROXY_RETRY_ROUNDS` 代理失败轮询次数（默认 2）
- `PROXY_RETRY_DELAY_MS` 轮询间隔（毫秒，默认 200）

系统设置（管理台 → 系统设置）：

- 日志保留天数（默认 30）
- 会话时长（小时，默认 12）
- 管理员密码（首次登录自动初始化，可在系统设置中修改）

### 3) Admin UI

```bash
bun run dev:admin
```

前端配置（`apps/admin/.env` 可选）：

- `VITE_API_BASE` 管理 API 基址（默认同域）
- `VITE_API_TARGET` 本地开发代理目标（默认 http://localhost:8787）

### 4) 常用脚本

```bash
bun run fix
```

用于自动修正 package.json 常见问题（等价于 `bun pm pkg fix`）。

## New API 兼容接口

为了支持 all-api-hub 等插件同步渠道，Worker 提供 New API 风格的渠道管理接口：

- 路径前缀：`/api/channel`
- 认证方式：`Authorization: Bearer {管理员密码}`（或管理台登录 token）
- 可选请求头：`New-Api-User: 1`

支持的常用接口：
- `GET /api/channel` 渠道列表
- `GET /api/channel/` 渠道列表（兼容尾斜杠）
- `GET /api/group` 渠道分组列表
- `GET /api/channel/search` 渠道搜索
- `POST /api/channel` 新增渠道（单条）
- `PUT /api/channel` 更新渠道
- `DELETE /api/channel/:id` 删除渠道
- `GET /api/channel/test/:id` 渠道连通性测试
- `GET /api/channel/fetch_models/:id` 拉取渠道模型
- `GET /api/user/models` 用户可用模型列表

## D1 数据库

在 `apps/worker/migrations/0001_init.sql` 定义表结构，使用 Wrangler 迁移：

```bash
bun run --filter new-api-lite-worker db:migrate
```

## 忘记管理员密码

管理员密码存储为哈希，可通过删除设置记录来重置，下一次登录会用输入的密码重新初始化：

```bash
bunx wrangler d1 execute DB --command "DELETE FROM settings WHERE key = 'admin_password_hash';"
```

## 生产部署

### 1) 准备 Cloudflare 资源

1. 创建 D1 数据库并回填 `apps/worker/wrangler.toml` 的 `database_id`：

```bash
bunx wrangler d1 create new_api_lite
```

2. 设置 Worker 变量与密钥（如 CORS_ORIGIN）：

其他变量可继续放在 `apps/worker/wrangler.toml` 的 `[vars]` 中，`CORS_ORIGIN` 需指向管理台域名。

### 2) 执行生产迁移

```bash
bunx wrangler d1 migrations apply DB
```

### 3) 部署 Worker

```bash
bun run --filter new-api-lite-worker deploy
```

### 4) 构建并部署 Admin

```bash
bun run --filter new-api-lite-admin build
```

将 `apps/admin/dist` 发布到 Cloudflare Pages 或任意静态托管；如需指定 API 基址，请在构建前设置 `VITE_API_BASE`（例如 `apps/admin/.env.production`）。

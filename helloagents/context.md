# 项目上下文

## 1. 基本信息

```yaml
名称: new-api-lite
描述: 基于 Cloudflare Workers + D1 的简易版 new-api
类型: Web服务
状态: 开发中
```

## 2. 技术上下文

```yaml
语言: TypeScript
框架: Hono + Vite
包管理器: bun
构建工具: Wrangler + Vite
```

### 主要依赖
| 依赖 | 版本 | 用途 |
|------|------|------|
| Hono | 待定 | Worker 路由与管理台 TSX |
| Wrangler | 待定 | Workers 构建与部署 |
| Vite | 待定 | 管理台构建 |
| TailwindCSS | 待定 | 管理台样式与设计系统 |

## 3. 项目概述

### 核心功能
- OpenAI 兼容代理（/v1/*）
- 渠道管理、模型广场、令牌管理、使用日志、数据面板
- 管理员登录与权限
- New API 兼容渠道管理接口（/api/channel）
- 系统设置（日志保留天数）

### 项目边界
```yaml
范围内:
  - 单管理员密码登录
  - Token 默认全渠道
  - 使用日志可配置保留天数
范围外:
  - 多租户/复杂角色体系
  - 复杂计费结算与对账
```

## 4. 开发约定

### 代码规范
```yaml
命名风格: camelCase
文件命名: kebab-case
目录组织: apps/worker + apps/admin
```

### 错误处理
```yaml
错误码格式: ERR_{模块}_{含义}
日志级别: info/warn/error
```

### 测试要求
```yaml
测试框架: vitest
覆盖率要求: 核心逻辑覆盖
测试文件位置: tests/
```

### Git规范
```yaml
分支策略: trunk-based
提交格式: conventional commits
```

## 5. 当前约束（源自历史决策）

| 约束 | 原因 | 决策来源 |
|------|------|---------|
| Cloudflare Workers + D1 | 技术栈约束 | new-api-lite#D001 |
| 登录密码来自环境变量 | 安全要求 | new-api-lite#D002 |
| Token 默认全渠道 | 产品规则 | new-api-lite#D003 |
| 使用日志保留天数可配置 | 合规/成本 | new-api-lite#D004 |

## 6. 已知技术债务（可选）

| 债务描述 | 优先级 | 来源 | 建议处理时机 |
|---------|--------|------|-------------|
| 暂无 | - | - | - |

# proxy 模块

## 职责
- 提供 OpenAI 兼容 API 代理
- 根据权重选择渠道并支持故障回退
- 记录用量日志并回写额度

## 接口定义
- `/v1/*` OpenAI 兼容代理路径

## 行为规范
- 基于令牌鉴权
- 按渠道权重随机排序
- 支持从非流式 JSON、响应头与流式 SSE 解析 usage 字段
- 流式请求自动补 `stream_options.include_usage=true` 以便上游返回 usage
- 可配置失败重试轮询（响应 5xx/429 时触发）

## 依赖关系
- `channels` / `tokens` / `usage_logs` 表
- `tokenAuth` 中间件

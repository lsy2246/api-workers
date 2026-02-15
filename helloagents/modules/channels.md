# channels 模块

## 职责
- 渠道配置的增删改查
- 渠道连通性测试与模型同步
- 渠道权重与状态管理

## 接口定义
- `GET /api/channels` 渠道列表
- `POST /api/channels` 新建渠道
- `PATCH /api/channels/:id` 更新渠道
- `DELETE /api/channels/:id` 删除渠道
- `POST /api/channels/:id/test` 连通性测试
- `GET /api/channel` New API 兼容列表
- `GET /api/channel/search` New API 兼容搜索
- `POST /api/channel` New API 兼容新增
- `PUT /api/channel` New API 兼容更新
- `DELETE /api/channel/:id` New API 兼容删除
- `PUT /api/channel/tag` New API 兼容标签批量更新
- `POST /api/channel/tag/enabled` New API 兼容标签批量启用
- `POST /api/channel/tag/disabled` New API 兼容标签批量停用
- `GET /api/channel/test/:id` New API 兼容连通性测试
- `GET /api/channel/fetch_models/:id` New API 兼容模型拉取
- `GET /api/group` New API 兼容分组列表

## 行为规范
- `base_url` 保存为无尾斜杠格式
- 创建渠道时可传入自定义 `id`，未提供则自动生成
- 连通性测试调用 `/v1/models`
- 测试成功后更新 `models_json`
- New API 兼容层支持 `type`/`group`/`priority` 等字段映射，并保留扩展字段到 `metadata_json`
- New API 标签（tag）存储在 `metadata_json.tag`，标签接口按该字段批量更新
- New API 分组列表从 `group_name` 字段解析，空时返回 `default`

## 依赖关系
- `channels` 表
- `models` 模块（聚合读取）
- `newApiAuth` 中间件

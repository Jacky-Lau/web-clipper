# Notion 公开 API 迁移可行性评估

> 评估日期：2026-04-09
> 当前代码位置：`src/common/backend/services/notion/`

## 背景

当前 Web Clipper 的 Notion 集成使用的是 **Notion 内部私有 API** (`https://www.notion.so/api/v3/`)，通过浏览器 Cookie 进行认证。这些 API 未公开文档化，随时可能发生 breaking change。本文档评估是否可以迁移到 [Notion 公开 API](https://developers.notion.com/)。

## 当前使用的内部 API

| # | 内部端点 (`/api/v3/`) | 功能 | 调用位置 |
|---|---|---|---|
| 1 | `loadUserContent` | 获取当前用户信息 | `getUserContent()` |
| 2 | `getSpacesInitial` | 获取用户的所有 workspace | `getSpaces()` |
| 3 | `getPublicSpaceData` | 获取 workspace 名称 | `getSpaceName()` |
| 4 | `getUserSharedPagesInSpace` | 列出 workspace 下的页面 | `loadSpace()` |
| 5 | `getRecentPageVisits` | 获取最近访问的页面和 collection | `getRecentPageVisits()` |
| 6 | `saveTransactionsFanout` | 通过底层事务创建空页面 | `createEmptyFile()` |
| 7 | `getUploadFileUrl` | 获取文件上传签名 URL | `getFileUrl()` |
| 8 | `enqueueTask` (importFile) | 将 Markdown 文件导入到 block | `createDocument()` |

## 逐项替代分析

### ✅ 可完全替代

#### 1. 用户信息获取
- **当前**：`loadUserContent` → 解析 `recordMap.notion_user`，提取 `name`, `email`, `profile_photo`
- **公开 API**：`GET /v1/users/me`，返回 `name`, `avatar_url`, `type` 等
- **结论**：完全覆盖

#### 2. 页面/数据库列表获取
- **当前**：`getUserSharedPagesInSpace` → 获取指定 workspace 下的 page 和 collection_view_page
- **公开 API**：`POST /v1/search`，支持按 `page` / `database` 过滤
- **结论**：可获取 Integration 有权限访问的所有页面和数据库，信息足以构建 repository 列表

#### 3. 创建页面
- **当前**：`saveTransactionsFanout` → 发送底层 operations 创建空 block
- **公开 API**：`POST /v1/pages`，支持在指定 page 或 database 下创建子页面，可设置 title 和初始内容
- **结论**：完全覆盖 `PAGE` 和 `COLLECTION_VIEW_PAGE` 两种场景

#### 4. 文件上传
- **当前**：`getUploadFileUrl` → 获取签名 URL → PUT 上传
- **公开 API**：File Upload API（支持小文件/大文件/分片上传）
- **结论**：完全覆盖

### ⚠️ 需调整但可实现

#### 5. Workspace 列表
- **当前**：`getSpacesInitial` + `getPublicSpaceData` → 列出所有 workspace 及名称
- **公开 API**：**无直接端点**列出 workspace
- **替代方案**：
  - 用 `POST /v1/search` 搜索所有内容，从 `parent.workspace_id` 提取 workspace 信息
  - 或简化逻辑，不按 workspace 分组，直接展示所有可访问的页面/数据库
- **注意**：公开 API 基于 Integration，一个 Integration 绑定一个 workspace；多 workspace 场景需多个 token

### ❌ 无法直接替代

#### 6. 最近访问页面
- **当前**：`getRecentPageVisits` → 获取 collection 元信息，用于匹配 `collection_view_page`
- **公开 API**：**不提供**用户最近访问历史
- **替代方案**：用 `POST /v1/search` 过滤 `database` 类型直接获取数据库列表，不再依赖最近访问记录
- **影响**：低，功能可通过 search 补偿

#### 7. Markdown 导入 ⭐ 最关键的差异
- **当前**：上传 `.md` 文件 → `enqueueTask(importFile)` → Notion 内部自动解析 Markdown 为 blocks
- **公开 API**：**不支持** Markdown 文件直接导入
- **替代方案**：自行实现 Markdown → Notion Blocks 转换
  - 使用 `POST /v1/blocks/{id}/children` 逐个追加 block
  - 需要 Markdown 解析器（如 `markdown-it`）将 MD 转为 Notion block JSON
  - 社区库推荐：[`@tryfabric/martian`](https://github.com/tryfabric/martian) 可做 MD → Notion blocks
  - 需处理的 block 类型：标题、段落、列表、代码块、引用、图片、表格等
- **影响**：高，是迁移的最大工作量

## 认证方式变化

| 维度 | 当前（Cookie） | 公开 API（OAuth 2.0） |
|---|---|---|
| 认证方式 | 浏览器 Cookie 自动注入 | OAuth 2.0 / Internal Integration Token |
| 授权范围 | 用户全部数据 | 仅用户显式授权的页面 |
| 用户设置门槛 | 登录 Notion 即可 | 需创建/授权 Integration |
| 稳定性 | ❌ 私有 API，随时可能失效 | ✅ 官方保障，有版本管理 |
| 需要的权限 | `cookies` + `https://www.notion.so/*` | 仅需存储 OAuth token |

### OAuth 接入流程
1. 在 [Notion Integrations](https://www.notion.so/my-integrations) 注册应用
2. 用户点击授权 → 跳转 Notion OAuth 页面 → 选择要授权的页面
3. 回调获取 `access_token`
4. 后续请求带 `Authorization: Bearer {token}`

## 迁移方案

### Phase 1：基础设施（预计 0.5 天）
- [ ] 引入 `@notionhq/client` SDK
- [ ] 实现 OAuth 2.0 认证流程（替代 Cookie 方案）
- [ ] 在 Chrome Extension 中存储 OAuth token

### Phase 2：读取类 API 替换（预计 0.5 天）
- [ ] `getUserInfo()`：替换为 `GET /v1/users/me`
- [ ] `getRepositories()`：替换为 `POST /v1/search`，按 page/database 分类
- [ ] 移除 `getSpacesInitial`、`getPublicSpaceData`、`getRecentPageVisits` 调用
- [ ] 调整 workspace 分组逻辑（改为从 search 结果中提取）

### Phase 3：写入类 API 替换（预计 1-2 天）⭐
- [ ] `createEmptyFile()`：替换为 `POST /v1/pages`
- [ ] 引入 `@tryfabric/martian` 或自建 Markdown → Notion Blocks 转换器
- [ ] 替换 `enqueueTask(importFile)` 为 `POST /v1/blocks/{id}/children` 逐块写入
- [ ] 文件上传改用公开 File Upload API
- [ ] 充分测试各种 Markdown 格式的转换效果

### Phase 4：清理（预计 0.5 天）
- [ ] 移除所有 `api/v3` 调用
- [ ] 移除 Cookie 相关逻辑（`cookieService`、`webRequestService`）
- [ ] 移除 `unwrapValue()` 兼容函数
- [ ] 更新 `permission` 配置，移除 `cookies` 权限
- [ ] 更新类型定义（`types.ts`）适配公开 API 返回结构

## 风险与注意事项

1. **用户体验退步**：Cookie 方式零配置，OAuth 需要用户手动授权页面，且只能访问授权范围内的页面
2. **Markdown 转换精度**：自行转换可能不如 Notion 内部 importFile 完整，需充分测试边界情况
3. **API 限速**：公开 API 有 [速率限制](https://developers.notion.com/reference/request-limits)（平均 3 req/s），批量写入 blocks 时需注意
4. **Block 数量限制**：`PATCH /v1/blocks/{id}/children` 单次最多追加 100 个 block，长文档需分批
5. **图片处理**：Markdown 中的外部图片链接需确认公开 API 是否支持 `image` block 的 external URL 类型

## 总结

| 维度 | 评估 |
|---|---|
| 整体可行性 | ✅ **可行** |
| 主要障碍 | Markdown → Notion Blocks 转换 |
| 预计工作量 | 2-3 天 |
| 稳定性收益 | 大幅提升，告别私有 API 不稳定风险 |
| 用户体验变化 | 需额外 OAuth 授权步骤，门槛略有提高 |
| 推荐程度 | ⭐⭐⭐⭐ 建议迁移 |

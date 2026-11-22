# 双语术语知识图谱：第一阶段技术方案

> 状态：Draft  
> 版本：v0.5
> 日期：2026-11-22
> 关联文档：[产品需求文档](./product-requirements.md)

## 1. 已确认的技术决策

本方案基于以下已确认前提：

- 第一阶段只服务单个用户；
- 用户每次只输入一个关键词，不处理长句和批量术语提炼；
- 系统跳过候选术语多选环节，仅检查拼写、规范名称和歧义；
- 语境明确时自动继续，只有语境会显著改变术语含义时才询问用户；
- 正式节点生成前必须联网验证中英文术语和领域定义；
- 应用采用 Next.js 与 TypeScript；
- 应用使用标准 Next.js App Router，并部署到 Vercel；
- 前后端放在同一个 Next.js 项目和仓库中，逻辑分层但第一阶段不拆成两个独立服务；
- 前端主要界面为关系图，右侧固定显示当前节点详情；
- 第一阶段用单一 JSON 文档表示节点和关系，并保存在浏览器 `localStorage`；
- Neon PostgreSQL 作为需要跨设备持久化后的升级方案，不阻塞第一阶段；
- 第一阶段不使用 Neo4j 或独立向量数据库；
- 第一阶段不引入 LangChain 或 LangGraph，直接使用 OpenAI 官方 SDK 和应用自己的任务状态机；
- 已点亮节点与 AI 推荐的未点亮节点分别存储。

产品需求文档与本方案均已统一为单关键词输入流程。

## 2. 总体架构

```text
Browser
├── Term Input
├── Relationship Graph
├── Node Detail Panel
├── localStorage
└── JSON Import / Export
          │
          ▼
Next.js Application
└── Future Route Handler
    └── OpenAI Responses API
```

### 2.1 推荐技术栈

| 层级 | 技术 | 用途 |
| --- | --- | --- |
| Web 框架 | Next.js + TypeScript | 页面、服务端接口和应用编排 |
| UI | React + Tailwind CSS | 术语输入、关系图和右侧节点详情 |
| 图展示 | React Flow | 渲染可点击节点、边、缩放和拖动 |
| 部署平台 | Vercel | 标准 Next.js 构建、Preview 与生产部署 |
| 第一阶段存储 | localStorage + JSON 文件 | 单用户本地持久化、导入和导出 |
| 数据校验 | Zod | JSON 导入和未来 AI 结构化输出校验 |
| AI 接口 | OpenAI Responses API | 联网研究、结构化生成和关系推断 |

第一阶段不实现后台任务、数据库和高级自动布局。先验证节点字段、关系图、右侧详情和 Agent 输出流程。

### 2.2 Next.js 前后端组织方式

Next.js 可以同时承载浏览器界面和服务端能力。本项目第一阶段采用“单仓库、统一部署、逻辑分层”的全栈形态，而不是建立一个前端项目和一个独立后端项目。

```text
Browser
  ↓
React Page / View / Component
  ↓
Route Handler / Server Action
  ↓
Application and Domain Service
  ↓
Repository
  ↓
localStorage JSON
```

各层职责如下：

- 浏览器负责输入、编辑、JSON 存储和导入导出，但不直接调用模型；
- Page 只处理路由级布局、初始数据和 View 组装；
- 第一阶段 View 表达关系图和右侧节点详情；
- Route Handler 与 Server Action 提供服务端入口，但不直接承载领域规则；
- Service 负责术语研究、节点生成、关系推断和图谱投影；
- Repository 边界负责 JSON 读写，未来可替换成 Neon 实现；
- OpenAI 等外部服务始终从服务端访问。

“逻辑分层”意味着前端和服务端代码边界清晰、可以单独测试；“统一部署”意味着第一阶段不增加跨服务认证、接口版本、CORS 和两套部署流水线。未来只有在后台任务规模、独立扩容或团队协作产生明确需要时，才将服务端能力拆成独立服务。

### 2.3 部署与 JSON 存储

项目使用标准 Next.js，不保留 Vinext、Cloudflare Workers、Wrangler、D1 或 Sites Hosting 配置。Vercel 从 GitHub 的 `main` 分支创建生产部署，其他分支和 Pull Request 创建 Preview Deployment。

知识数据使用带版本号的 JSON 文档：

```json
{"version":1,"nodes":[],"edges":[]}
```

- 浏览器自动保存到 `localStorage`；
- 用户可以导入和导出完整 JSON；
- 导入时必须通过 Zod Schema 校验；
- Vercel 文件系统不用于持久写入；
- JSON Repository 与 UI 分离，未来迁移 Neon 时不改变节点字段和页面调用方式；
- 当前方案不支持跨浏览器和跨设备同步，该能力留给 Neon 阶段。

### 2.4 LangChain 与 LangGraph 决策

#### 定位区别

| 技术 | 主要定位 | 适合的场景 |
| --- | --- | --- |
| LangChain | 统一模型、工具和中间件的 Agent 开发框架 | 多模型供应商、通用工具调用循环、RAG 组件组合 |
| LangGraph | 带状态、分支、暂停恢复和持久化能力的工作流编排框架 | 多分支工作流、复杂人工介入、多 Agent、长任务断点恢复 |
| OpenAI SDK | 直接访问 Responses API、Web Search、Structured Outputs 和工具调用 | 单一模型供应商、流程明确、需要完整使用 OpenAI 原生能力 |

LangChain 的 `createAgent` 本身构建在 LangGraph 之上。若当前项目引入 LangChain Agent，会同时引入模型适配层、Agent 循环和部分 LangGraph 运行时抽象。

#### 第一阶段不引入的原因

当前节点生成是一条由应用控制的确定性流程：

```text
规范化
  ↓
判断语境
  ↓
必要时等待用户选择
  ↓
联网研究
  ↓
生成并校验节点
  ↓
推断关系
  ↓
推荐未点亮节点
```

流程的步骤、分支条件和数据写入规则均由业务代码确定，不需要模型自行规划任务或自由选择下一步。当前只有一个主要人工暂停点，可以由 `generation_jobs.status` 和数据库中间结果完成暂停与恢复。

第一阶段直接采用：

```text
Next.js Domain Service
        ↓
TermResearchProvider interface
        ↓
OpenAITermResearchProvider
        ↓
OpenAI Responses API
```

相比额外引入 LangChain 和 LangGraph，这样可以：

- 直接获得 Web Search 的完整来源和引用数据；
- 直接使用 Structured Outputs，并由 Zod 执行业务校验；
- 避免 LangGraph Checkpoint 与 `generation_jobs` 形成两套状态来源；
- 减少依赖、调试层级和框架升级成本；
- 让数据库写入始终受应用服务控制，而不是由通用 Agent 自主执行。

#### 保留未来迁移边界

模型调用通过项目自己的接口隔离：

```ts
interface TermResearchProvider {
  detectContext(input: DetectContextInput): Promise<ContextResult>;
  researchTerm(input: ResearchTermInput): Promise<ResearchResult>;
  composeNode(input: ComposeNodeInput): Promise<NodeDraft>;
  inferRelations(input: RelationInput): Promise<RelationProposal[]>;
  suggestNodes(input: SuggestionInput): Promise<NodeSuggestion[]>;
}
```

第一阶段实现 `OpenAITermResearchProvider`。因此未来更换模型供应商或改用 LangChain 时，不需要修改节点、关系和证据的数据模型。

#### 重新评估条件

出现下列多项需求时，再评估 LangChain 或 LangGraph：

- 同时支持多个模型供应商并需要运行时切换；
- 接入大量异构工具、Retriever、文档 Loader 或向量库；
- 模型需要自主选择工具并循环研究；
- 不同知识领域需要走显著不同的研究分支；
- 需要并行研究多个来源，再汇总和交叉审核；
- 存在多个长期人工确认点；
- 引入术语研究、证据审核和关系推断等多个 Agent；
- 需要框架级 Checkpoint、复杂重试、回退和补偿；
- 任务普遍运行数分钟以上，需要细粒度断点恢复和执行追踪。

届时的迁移范围应限制在 AI 工作流编排层，不改变 JSON 节点契约。

## 3. 图数据的存储方式

### 3.1 逻辑模型与第一阶段存储

产品逻辑模型是有向属性图：

```text
Node ── typed and directed Edge ──▶ Node
```

物理存储采用一个带版本号的 JSON 文档：

- `nodes` 数组保存正式、草稿和建议节点；
- `edges` 数组保存节点之间的有向关系；
- 整个文档自动写入浏览器 `localStorage`；
- 用户可导入、导出 JSON 作为备份和迁移格式。

节点与边构成逻辑图，第一阶段直接从 JSON 生成基础关系图，不实现图数据库和复杂布局。

### 3.2 未来迁移关系数据库

出现跨设备同步、多浏览器访问、服务端任务恢复或数据规模增长后，再将 JSON Repository 替换为 Neon PostgreSQL。届时术语名称、领域、范围、解释和状态使用独立列，以便：

- 可以建立索引并精确搜索；
- 可以单独修改和验证字段；
- 可以记录字段级来源；
- 可以防止 AI 覆盖用户修改；
- 可以检测重复节点；
- 数据迁移和统计更稳定。

JSON 导出格式继续保留，作为用户可控的备份和交换格式。

## 4. Neon 阶段目标数据模型

本节不是第一阶段的实现要求，而是未来迁移 Neon 时的数据目标。所有主键使用 UUID，所有时间使用 UTC 保存，在界面按用户时区显示。

### 4.1 `workspaces`

虽然第一阶段只有一个用户，仍保留固定工作区，以避免未来重构全部表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 工作区 ID |
| `name` | text | 默认知识库名称 |
| `created_at` | timestamptz | 创建时间 |

第一阶段只初始化一条记录，不实现工作区切换。

### 4.2 `inputs`

记录用户原始输入和规范化结果。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 输入记录 ID |
| `workspace_id` | uuid | 所属工作区 |
| `raw_term` | text | 用户原始输入，不覆盖 |
| `normalized_term` | text | 去除多余空格和统一字符后的文本 |
| `suggested_correction` | text nullable | 可能的规范名称或错字修正 |
| `correction_reason` | text nullable | 修正理由 |
| `status` | enum | 当前处理阶段 |
| `created_at` | timestamptz | 输入时间 |

### 4.3 `nodes`

一行代表一个已点亮的正式节点。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 节点 ID |
| `workspace_id` | uuid | 所属工作区 |
| `source_input_id` | uuid nullable | 首次创建该节点的输入 |
| `term_zh` | text | 规范中文术语 |
| `term_en` | text | 规范英文术语 |
| `domain_zh` | text | 具体中文领域 |
| `domain_en` | text | 对应英文领域 |
| `scope_zh` | text | 精确中文知识范围 |
| `scope_en` | text | 精确英文知识范围 |
| `definition_zh` | text | 中文解释 |
| `definition_en` | text | 英文解释 |
| `examples_zh` | text | 中文案例 |
| `examples_en` | text | 英文案例 |
| `status` | enum | `generating`、`confirmed`、`needs_review`、`archived` |
| `confidence` | numeric | AI 综合置信提示，不代表事实证明 |
| `user_edited_fields` | text[] | 用户修改过的字段 |
| `created_at` | timestamptz | 创建时间 |
| `updated_at` | timestamptz | 更新时间 |

关键唯一性不直接设置为 `term_zh` 唯一。同一中文术语在不同领域可能需要分别建立节点，例如证券清算与支付清算。重复判断应综合：

```text
workspace + normalized term + domain + scope
```

### 4.4 `node_aliases`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 别名 ID |
| `node_id` | uuid | 所属节点 |
| `language` | enum | `zh`、`en` 或 `mixed` |
| `alias` | text | 别名或缩写 |
| `alias_type` | enum | `synonym`、`abbreviation`、`market_variant`、`deprecated` |
| `is_preferred` | boolean | 是否为首选表达 |

### 4.5 `edges`

一行代表一条有方向、有类型的知识关系。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 关系 ID |
| `workspace_id` | uuid | 所属工作区 |
| `source_node_id` | uuid | 起点节点 |
| `target_node_id` | uuid | 终点节点 |
| `relation_type` | enum | 关系类型 |
| `explanation_zh` | text | 中文关系说明 |
| `explanation_en` | text | 英文关系说明 |
| `confidence` | numeric | AI 置信提示 |
| `status` | enum | `proposed`、`confirmed`、`rejected` |
| `created_by` | enum | `ai` 或 `user` |
| `created_at` | timestamptz | 创建时间 |

第一阶段关系类型：

```text
precedes
follows
part_of
depends_on
enables
contrasts_with
is_a
related_to
```

数据库约束至少包括：

- 起点和终点不能相同；
- 同一对节点、同一方向、同一类型不能重复；
- 删除节点时不得留下悬空关系；
- `related_to` 仅作为其他关系均不适用时的兜底。

### 4.6 `sources`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 来源 ID |
| `url` | text | 规范化 URL |
| `title` | text | 页面或文档标题 |
| `publisher` | text | 发布机构 |
| `source_type` | enum | 监管、标准、官方文档、论文等 |
| `published_at` | date nullable | 发布日期 |
| `accessed_at` | timestamptz | 检索日期 |
| `market_scope` | text nullable | 适用市场或地区 |
| `language` | text | 来源语言 |

### 4.7 `node_evidence`

字段级关联节点与来源，而不是只在节点底部堆放链接。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 证据 ID |
| `node_id` | uuid | 被支持的节点 |
| `source_id` | uuid | 来源 |
| `supported_fields` | text[] | 例如 `term_en`、`definition_zh` |
| `evidence_summary` | text | 对来源支持内容的转述摘要 |
| `source_excerpt` | text nullable | 必要的短摘录，需遵守引用限制 |
| `strength` | enum | `primary`、`supporting`、`weak` |

### 4.8 `suggestions`

未点亮节点不进入 `nodes` 表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 建议 ID |
| `workspace_id` | uuid | 所属工作区 |
| `anchor_node_id` | uuid | 推荐所依附的正式节点 |
| `term_zh` | text | 建议中文术语 |
| `term_en` | text nullable | 初步英文术语 |
| `domain_zh` | text | 初步领域 |
| `reason_zh` | text | 推荐原因 |
| `proposed_relation_type` | enum | 与锚点的预期关系 |
| `confidence` | numeric | 推荐置信提示 |
| `status` | enum | `pending`、`accepted`、`dismissed`、`expired` |
| `created_at` | timestamptz | 创建时间 |

接受建议后，以该术语创建新的 `inputs` 记录，并进入完整联网验证流程。

### 4.9 `generation_jobs`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 任务 ID |
| `input_id` | uuid | 对应输入 |
| `job_type` | enum | 节点生成、关系整理或建议生成 |
| `status` | enum | 当前状态 |
| `progress` | integer | 0～100，仅用于界面反馈 |
| `attempt_count` | integer | 重试次数 |
| `last_error_code` | text nullable | 稳定错误码 |
| `last_error_message` | text nullable | 可读错误信息 |
| `model_metadata` | jsonb nullable | 模型和调用参数 |
| `created_at` | timestamptz | 创建时间 |
| `updated_at` | timestamptz | 更新时间 |

### 4.10 `node_revisions`

每次人工编辑或 AI 重新生成前保存节点快照。第一阶段可以只提供恢复能力，不必先实现复杂差异界面。

## 5. 单关键词生成工作流

### 5.1 状态机

```text
submitted
    ↓
normalizing
    ↓
detecting_context
    ├── context_required ──▶ waiting_for_context
    │                              │
    │                              └── user selected
    ▼
researching
    ↓
composing
    ↓
validating
    ├── needs_review
    └── confirmed
          ↓
inferring_relations
          ↓
generating_suggestions
          ↓
completed
```

任何阶段都可进入 `failed`，但必须保留原始输入和已取得的中间结果，以支持从失败阶段重试。

### 5.2 阶段一：规范化和错字检查

系统执行：

- Unicode 与全半角规范化；
- 去除首尾和重复空格；
- 检查已有节点及别名；
- 判断是否可能是错字、非首选表达或缩写；
- 识别是否已经存在同领域节点。

系统不得静默修改可能具有专业差异的词。例如“交割”和“交收”可能因市场和语境而不同。只有普通输入错误且置信度很高时才自动纠正，同时保留 `raw_term` 和纠正理由。

### 5.3 阶段二：语境判断

语境判断结合：

1. 输入术语本身；
2. 已有图谱中最近使用和相邻领域；
3. 同名术语可能存在的行业含义；
4. 初步联网检索结果。

满足以下任一条件时询问用户：

- 存在两个以上常见语境，且对应英文、定义或流程位置不同；
- 最高语境置信度低于配置阈值；
- 新判断与现有同名节点的领域冲突；
- 不同地区市场对术语存在实质不同定义。

询问应控制为一次，并给出 2～4 个具体选项。若语境明确则自动继续。

### 5.4 阶段三：联网研究

该阶段必须实际使用联网搜索，产出：

- 规范中文术语；
- 规范英文术语；
- 中英文别名和缩写；
- 具体领域和范围；
- 定义、工作机制和案例的事实材料；
- 易混概念和流程位置；
- 来源及字段级证据；
- 无法确定的争议或地区差异。

不得先生成完整答案再用搜索结果装饰引用。检索材料必须作为节点生成输入。

### 5.5 阶段四：结构化节点生成

使用严格 JSON Schema 生成节点草稿，再执行应用层业务校验：

- 必填字段非空；
- 中英文关键事实一致；
- 领域足够具体；
- 范围不比领域更宽；
- 英文不是明显的机械逐字翻译；
- 关键术语和定义有证据支持；
- 案例没有引入来源未支持的具体事实；
- 不与现有节点重复。

结构校验通过不等于事实正确，二者必须分别处理。

### 5.6 阶段五：关系推断

模型只接收有限的局部上下文：

- 当前新节点；
- 相同或相邻领域的正式节点；
- 名称或描述相似节点；
- 当前节点可能连接的一至两层邻居。

系统不把整个知识库发送给模型。AI 返回 `proposed` 关系，第一阶段可以在图谱中显示为待确认边；只有用户确认或达到明确的自动确认规则后才成为 `confirmed`。

### 5.7 阶段六：未点亮节点

每次默认推荐 3～5 个，优先级为：

1. 必要前置概念；
2. 紧邻后续流程；
3. 关键组成部分；
4. 最容易混淆的对比概念；
5. 能补齐当前局部图谱的重要上位概念。

未点亮节点只保存轻量信息，不提前生成长解释或完整证据。

## 6. 来源优先策略

来源选择需要同时评估权威性、语境一致性、时效性和可追溯性，而不是简单计算搜索结果数量。

### 6.1 来源等级

| 等级 | 来源 | 示例类型 | 用途 |
| --- | --- | --- | --- |
| S | 监管机构、法律法规、国际标准组织 | 监管规则、ISO 标准、官方术语表 | 法定或标准定义、规范英文名称 |
| A | 交易所、清算机构、协议或技术官方文档 | 市场规则、产品规范、RFC、项目官方文档 | 实际流程、系统行为、技术定义 |
| B | 学术论文、权威教材、大学课程资料 | 同行评审论文、出版社教材 | 原理解释、概念边界和历史背景 |
| C | 大型专业机构和成熟行业厂商 | 行业白皮书、专业研究报告 | 案例、行业实践和辅助解释 |
| D | 高质量专业文章 | 专业媒体、工程团队文章 | 补充说明和检索线索 |
| E | 论坛、聚合页和无明确作者内容 | 问答、个人转载、百科式聚合 | 仅发现线索，不单独支撑关键字段 |

### 6.2 选择规则

- 规范名称和核心定义优先由 S 或 A 级来源支撑；
- 技术概念优先使用标准、RFC、官方项目文档和原始论文；
- 金融术语必须检查来源所属市场和地区；
- 同一来源不得同时被当作多个独立来源；
- 搜索摘要不能作为最终证据，必须打开实际页面；
- 来源无法访问正文时，只能降级为弱证据；
- 关键结论发生冲突时，不进行多数投票，应解释适用市场或版本差异；
- 找不到足够可靠来源时将节点设为 `needs_review`，不得伪造确定性。

### 6.3 最低证据要求

一个正式节点至少满足：

- 英文主术语有一个 S/A 级来源，或两个相互独立的 B/C 级来源；
- 核心定义至少有一个高质量来源；
- 若定义依赖市场或地区，必须保存 `market_scope`；
- 示例可以由模型生成简化场景，但必须标明为说明性示例，不冒充真实案例；
- 来源记录访问时间，便于后续重新校验。

## 7. API 与服务边界

建议的第一阶段接口：

```text
POST   /api/terms
       提交一个关键词并创建生成任务

GET    /api/jobs/:jobId
       查询任务阶段、进度、错误和结果

POST   /api/jobs/:jobId/context
       提交语境选择并恢复任务

GET    /api/nodes/:nodeId
PATCH  /api/nodes/:nodeId
       查看和编辑节点

POST   /api/nodes/:nodeId/regenerate
       重新生成指定字段

GET    /api/graph?center=:nodeId&depth=1&view=:viewType
       获取局部图谱；view 使用 relationship、domain_tree 或 process

PATCH  /api/edges/:edgeId
       确认、修改或拒绝关系

POST   /api/suggestions/:id/accept
POST   /api/suggestions/:id/dismiss
       点亮或忽略建议节点

GET    /api/search?q=:query
       搜索中文、英文、别名和缩写
```

UI 内部的简单编辑可使用 Server Actions；需要流式、轮询或将来可能被其他客户端调用的能力使用 Route Handlers。业务逻辑必须放在独立 service 层，不能直接写在页面或路由中。

## 8. 图谱表示与后续投影

第一阶段直接把 JSON 中的全部 `nodes`、`edges` 和节点 `position` 传给 React Flow。关系图占主区域，点击节点后在右侧详情面板显示中英文术语、领域、范围、解释和案例。用户可以拖动节点，自动整理布局后续再实现。

### 8.1 后续局部加载

接入服务端持久化且节点数量明显增长后，默认只返回中心节点的一层邻居，用户展开时再请求下一层。响应结构：

```json
{
  "nodes": [
    {
      "id": "node-id",
      "kind": "confirmed",
      "data": {
        "termZh": "证券交收",
        "termEn": "Securities Settlement",
        "domainZh": "证券交易后处理",
        "status": "confirmed"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "relationType": "precedes",
      "status": "confirmed"
    }
  ]
}
```

建议节点在响应中映射为 `kind: suggested`。

### 8.2 同一图数据的三种投影

JSON 或未来数据库只保存一份 `nodes` 和 `edges`。第一阶段只实现关系图；需要领域树和流程视图时，再由服务端 Graph Projection Service 生成投影。

```text
nodes + edges
      │
      ▼
Graph Projection Service
      ├── relationship  → 局部关系图
      ├── domain_tree   → 领域树
      └── process       → 流程视图
```

#### 关系图投影

- 输入为中心节点和深度，默认 `depth=1`，最大为 `depth=2`；
- 使用所有已确认关系类型，并可附加少量待确认关系；
- 当前节点位于中心；
- 已确认邻居位于内圈，建议节点位于外围；
- `precedes`、`follows` 和 `depends_on` 提供左右方向约束；
- `is_a` 和 `part_of` 提供上下方向约束；
- `contrasts_with` 优先放在中心节点的相对侧；
- 不使用每次都会大幅变化的纯随机力导向结果作为默认布局。

#### 领域树投影

- 只使用 `is_a`、`part_of` 以及未来明确声明为层级关系的边；
- 根节点可以是当前领域或用户选定的上位概念；
- 默认从上到下分层；
- 一个节点有多个父节点时，投影层选择一个主要展示父节点；
- 其他父关系保留为次要边或跳转入口，不在数据库中复制节点；
- 子树支持折叠、展开，并独立标记其中尚未点亮的节点。

主要展示父节点的选择顺序为：用户固定选择 > 当前视图根节点下的最短路径 > 已确认关系 > 关系置信度 > 稳定 ID 排序。该规则必须确定性执行，保证相同输入得到稳定结果。

#### 流程视图投影

- 使用 `precedes`、`follows` 和 `depends_on`；
- 在投影阶段将 `follows` 规范化为反向的 `precedes`，只统一展示方向，不修改原始边；
- 默认从左到右排列，当前节点保持选中；
- 分支流程共享相同层级，汇合点只显示一个节点；
- `depends_on` 使用不同线型，避免与时间先后混淆；
- 投影前执行环检测；发现循环或方向冲突时返回诊断信息，并把相关边标记为待校验。

### 8.3 图布局与位置状态

布局位置仅属于某个视图的展示状态。同一节点可以在关系图、领域树和流程视图中拥有不同坐标：

```text
graph_view_state
├── id
├── workspace_id
├── view_type
├── root_node_id
├── node_id
├── x
├── y
├── pinned
├── layout_version
└── updated_at
```

唯一约束建议为：

```text
workspace_id + view_type + root_node_id + node_id
```

布局执行顺序：

1. 根据视图类型和关系语义生成层级、方向或环形约束；
2. 使用确定性布局算法计算初始坐标；
3. 执行节点碰撞、标签留白和边交叉优化；
4. 合并已保存位置；`pinned=true` 的用户位置不可被自动覆盖；
5. 仅调整新增节点附近的局部区域，尽量保持用户的空间记忆；
6. 保存坐标和 `layout_version`，但不修改任何 `edges`。

第一阶段关系图可采用自定义的语义方向布局；领域树与流程视图可采用 ELK 或同类有向层级布局。布局引擎必须封装在独立适配层，避免视图数据和具体库绑定。

### 8.4 前端交互

- 顶部提供“关系图 / 领域树 / 流程”视图切换；
- 切换时保持当前节点、缩放意图和详情面板上下文；
- 搜索结果先定位节点，再在当前视图中重新选择合适根节点；
- 用户拖动节点后保存当前视图的位置；
- “整理布局”只重算当前视图，并在覆盖未固定位置前提供明确反馈；
- 默认只加载局部投影，展开操作按需请求下一层。

### 8.5 前端组件与样式原则

前端采用“Page 组装 View，View 组装领域组件，领域组件复用基础 UI”的结构：

```text
Page
└── View
    ├── Feature component
    ├── Domain component
    └── UI primitive
```

第一阶段只实现关系图工作台。未来增加 `DomainTreeView` 和 `ProcessView` 时复用节点组件、选择状态和详情面板，不复制完整页面。

样式遵循以下约束：

- 颜色、字号、间距、边框和交互状态集中为少量设计令牌；
- 基础按钮、输入框、面板、状态标识等样式只定义一次；
- 页面文件不编写大段一次性样式，只负责结构和组合；
- 第一阶段使用简单确定性坐标；复杂布局未来由 Graph Projection Service 产生；
- 只保留能表达信息层级、状态差异和可访问性的视觉效果；
- 不引入纯装饰性的复杂动画、渐变、阴影层叠或额外视觉框架；
- 新增样式优先扩展已有组件 variant，确实无法复用时再创建新组件；
- 保证正文、辅助信息、节点状态和关系线具备足够对比度，并保留键盘焦点状态。

布局和组件样式使用 Tailwind utility；全局 CSS 只保存基础字体、焦点状态和 React Flow 必要覆盖，不引入额外组件框架。

## 9. 搜索与去重

第一阶段搜索顺序：

1. 中文或英文主名称精确匹配；
2. 别名、缩写精确匹配；
3. 前缀和包含匹配；
4. PostgreSQL 模糊匹配；
5. 结合领域排序。

第一阶段不强制生成 embedding。需要“按语义寻找相似节点”时再增加 pgvector；向量相似度只能用于召回，不可直接证明两个节点存在知识关系。

创建前执行重复检查。如果找到高相似节点，优先打开已有节点或提示同领域重复；如果领域不同，可以创建同名节点。

## 10. 用户修改与 AI 覆盖规则

- 用户手工修改的字段加入 `user_edited_fields`；
- 自动关系整理不得覆盖用户确认或修改过的关系；
- 单字段重新生成前必须保存 revision；
- 重新生成结果先作为草稿预览；
- 只有用户明确选择时，才能覆盖已编辑字段；
- AI 模型和提示词升级不得自动重写历史节点。

## 11. 错误处理与可恢复性

| 错误 | 行为 |
| --- | --- |
| 输入为空或过长 | 立即拒绝并说明限制 |
| 发现已有节点 | 返回已有节点，不重复生成 |
| 语境不明确 | 暂停任务并请求一次选择 |
| 搜索无可靠来源 | 保存为 `needs_review` 或不创建正式节点 |
| AI 输出不符合 Schema | 自动重试有限次数 |
| 中英文事实不一致 | 阻止确认并进入修复步骤 |
| 关系推断失败 | 节点仍可保存，关系任务可单独重试 |
| 建议节点生成失败 | 不影响正式节点完成 |

任务需要幂等键，避免用户刷新或重复点击后创建多个相同节点。

## 12. 单用户安全方案

第一阶段不实现注册、团队或协作权限，但需要：

- 本地 JSON 不保存 API Key 或其他密钥；
- 用户应通过导出 JSON 备份浏览器数据；
- 部署到公网时必须增加登录或访问保护；
- OpenAI API Key 只存在服务端环境变量；
- 客户端不能直接调用模型接口；
- 日志不记录完整双语解释和不必要的原始模型响应；
- 来源 URL 和模型调用元数据可以记录，但不得包含密钥；
- 接入 Neon 后再增加服务端备份和跨设备同步。

## 13. 推荐目录结构

```text
app/
├── globals.css
├── layout.tsx
└── page.tsx

components/
└── knowledge-graph/
    ├── knowledge-workspace.tsx
    ├── term-input.tsx
    ├── relationship-graph.tsx
    ├── node-detail-panel.tsx
    └── term-node.tsx

lib/
└── knowledge.ts
```

需要接入 Agent 时再增加 `app/api/terms/route.ts` 和 `server/ai/`，不提前创建空目录和抽象层。

## 14. 测试策略

### 14.1 单元测试

- JSON Schema 校验；
- JSON 导入与导出；
- 术语规范化；
- 重复检测；
- 关系方向校验；
- 来源等级与最低证据规则；
- AI 输出 Schema 校验；
- 用户编辑字段保护。

### 14.2 集成测试

- 创建节点并自动保存；
- 刷新后恢复本地 JSON；
- 导入错误结构时显示明确错误；
- Agent 结果返回后写入节点文档。

### 14.3 AI 质量评估集

建立一组固定的中英文术语样本，例如：

- 清算；
- 交收；
- 日切；
- 券款对付；
- 最终一致性；
- 幂等性。

每次修改提示词或模型配置后评估：

- 语境识别准确性；
- 英文术语正确性；
- 领域是否足够具体；
- 来源是否匹配当前语境；
- 中英文关键事实是否一致；
- 关系方向是否正确；
- 是否出现无来源支持的断言。

AI 测试不得只比较整段文本是否完全相同，应比较结构字段和事实约束。

## 15. 实施顺序

### Phase 1：数据与基础页面

- 使用标准 Next.js、React 和 Zod；
- 实现版本化节点与关系 JSON Schema；
- 完成单关键词输入、关系图和右侧节点详情；
- 使用 React Flow 展示可点击、可拖动的节点和边；
- 实现 localStorage 自动保存及 JSON 导入导出；
- 不实现数据库、动画和复杂图布局。

### Phase 2：节点生成闭环

- 实现规范化和错字检查；
- 实现语境判断与必要时的用户选择；
- 接入联网研究；
- 实现结构化节点生成、证据校验和持久化；
- 实现失败恢复和有限重试。

### Phase 3：服务端持久化

- 接入 Neon PostgreSQL 和 Drizzle；
- 将 JSON Repository 替换为服务端 Repository；
- 实现跨设备同步、revision 和任务恢复；
- 保留 JSON 导入导出。

### Phase 4：知识图谱与质量

- 实现关系推断和确认；
- 在现有 React Flow 基础关系图上增加关系推断和确认；
- 区分正式节点、建议节点和待校验状态；
- 实现局部展开和节点详情跳转；
- 实现 Graph Projection Service 及统一视图响应结构；
- 增加关系图、领域树和流程视图切换；
- 实现领域树的层级投影、多父节点处理和折叠；
- 实现流程视图的方向规范化、分支布局和环检测；
- 如实现可视化，再保存分视图节点位置和局部布局；
- 实现未点亮节点推荐、点亮和忽略；
- 实现 revision 和用户字段保护；
- 建立 AI 质量评估集；
- 完善备份、导出和运行监控。

## 16. 暂缓决策

以下内容不阻塞第一阶段开发：

- 持久化后台任务产品；
- Neon PostgreSQL、Drizzle 和跨设备同步；
- 领域树、流程视图和高级自动布局；
- embedding 模型与 pgvector；
- 图数据库；
- 多用户认证；
- 多工作区切换；
- 自动周期性重新校验；
- 复杂图算法和全局学习路径；
- LangChain、LangGraph 或多 Agent 编排框架。

## 17. 技术参考

- [OpenAI Responses API](https://developers.openai.com/api/reference/responses/overview)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [OpenAI Web Search](https://developers.openai.com/api/docs/guides/tools-web-search?api-mode=responses)
- [LangChain Overview](https://docs.langchain.com/oss/javascript/langchain/overview)
- [LangGraph Graph API](https://docs.langchain.com/oss/javascript/langgraph/thinking-in-graph-api)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Drizzle with Neon](https://orm.drizzle.team/docs/connect-neon)
- [React Flow](https://reactflow.dev/)
- [pgvector](https://github.com/pgvector/pgvector)


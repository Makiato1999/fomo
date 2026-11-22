# Fomo

一个面向个人使用的双语术语知识图谱。输入专业术语后，系统将验证术语和语境，生成包含中英文名称、领域、范围、解释、案例与来源的知识节点，并通过关系图、领域树和流程视图组织节点。

## 本地开发

需要 Node.js 22.13 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中填写服务端使用的 `OPENAI_API_KEY`。可通过 `OPENAI_MODEL` 覆盖默认模型；API Key 不会进入浏览器或本地 JSON。

开发服务器启动后，打开终端输出的本地地址。

当前版本会在 Next.js 服务端通过 Responses API 联网研究术语，校验结构与来源后，将知识节点保存为浏览器本地 JSON，并提供导入和导出。清除浏览器数据前请先导出备份。

## 常用命令

```bash
npm run dev
npm run build
npm run lint
```

产品需求和技术方案位于 [`docs/`](./docs/)。

import { z } from "zod";

export const nodeStatusSchema = z.enum(["confirmed", "suggested", "needs_review"]);
export type NodeStatus = z.infer<typeof nodeStatusSchema>;

export const sourceLevelSchema = z.enum(["S", "A", "B", "C", "D", "E"]);

const httpUrlSchema = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "来源地址必须使用 HTTP 或 HTTPS");

export const nodeSourceSchema = z.object({
  url: httpUrlSchema,
  title: z.string().trim().min(1),
  publisher: z.string().trim().min(1),
  level: sourceLevelSchema,
  sourceType: z.string().trim().min(1),
  marketScope: z.string(),
  accessedAt: z.string().trim().min(1),
  supportedFields: z.array(z.string().trim().min(1)),
  evidenceSummary: z.string().trim().min(1),
});
export type NodeSource = z.infer<typeof nodeSourceSchema>;

export const knowledgeNodeDataSchema = z.object({
  termZh: z.string().trim().min(1),
  termEn: z.string().trim().min(1),
  domainZh: z.string().trim().min(1),
  domainEn: z.string().trim().min(1),
  scopeZh: z.string().trim().min(1),
  scopeEn: z.string().trim().min(1),
  definitionZh: z.string().trim().min(1),
  definitionEn: z.string().trim().min(1),
  exampleZh: z.string().trim().min(1),
  exampleEn: z.string().trim().min(1).optional(),
  status: nodeStatusSchema,
  confidence: z.number().min(0).max(1).optional(),
  sourceCount: z.number().int().min(0).optional(),
  createdAt: z.string().optional(),
  suggestionReason: z.string().optional(),
  sources: z.array(nodeSourceSchema).optional(),
});
export type KnowledgeNodeData = z.infer<typeof knowledgeNodeDataSchema>;

export const knowledgeNodeRecordSchema = z.object({
  id: z.string().trim().min(1),
  position: z.object({ x: z.number(), y: z.number() }),
  data: knowledgeNodeDataSchema,
});
export type KnowledgeNodeRecord = z.infer<typeof knowledgeNodeRecordSchema>;

export const relationTypeSchema = z.enum([
  "precedes",
  "follows",
  "depends_on",
  "is_a",
  "part_of",
  "enables",
  "contrasts_with",
  "related_to",
]);

export const knowledgeEdgeRecordSchema = z.object({
  id: z.string().trim().min(1),
  source: z.string().trim().min(1),
  target: z.string().trim().min(1),
  relationType: relationTypeSchema,
  label: z.string().trim().min(1),
  status: z.enum(["confirmed", "proposed"]),
});
export type KnowledgeEdgeRecord = z.infer<typeof knowledgeEdgeRecordSchema>;

export const initialNodes: KnowledgeNodeRecord[] = [
  {
    id: "trade-clearing",
    position: { x: 70, y: 230 },
    data: {
      termZh: "交易清算",
      termEn: "Trade Clearing",
      domainZh: "证券交易后处理",
      domainEn: "Securities Post-Trade Processing",
      scopeZh: "成交后义务计算与净额处理",
      scopeEn: "Post-trade obligation calculation and netting",
      definitionZh:
        "交易清算发生在成交之后、最终交收之前。它确认交易双方的应收应付义务，并可能通过净额处理减少实际需要转移的证券与资金数量。清算回答的是“最终各方应当交付什么、收到什么”。",
      definitionEn:
        "Trade clearing takes place after execution and before final settlement. It validates the trade, determines each party’s obligations, and may net positions to reduce the amount of securities and cash that must ultimately move.",
      exampleZh:
        "例如，同一参与者当天既买入又卖出同一证券时，清算系统可能先计算其净头寸，再把净结果交给交收系统执行。",
      status: "confirmed",
      confidence: 0.95,
      sourceCount: 3,
      createdAt: "2026-11-16",
    },
  },
  {
    id: "securities-settlement",
    position: { x: 400, y: 210 },
    data: {
      termZh: "证券交收",
      termEn: "Securities Settlement",
      domainZh: "证券交易后处理",
      domainEn: "Securities Post-Trade Processing",
      scopeZh: "证券与资金的最终转移",
      scopeEn: "Final transfer of securities and cash",
      definitionZh:
        "证券交收是履行已确定交易义务的过程：证券从卖方转移给买方，资金按相反方向完成转移。它关注的是义务被实际、最终地履行，而不只是完成计算。",
      definitionEn:
        "Securities settlement is the process that fulfils confirmed trade obligations by completing the final transfer of securities to the buyer and the corresponding cash payment to the seller.",
      exampleZh:
        "在券款对付安排下，证券交付与资金支付相互关联，以降低一方已经交付而另一方未履约的本金风险。",
      status: "confirmed",
      confidence: 0.97,
      sourceCount: 4,
      createdAt: "2026-11-16",
    },
  },
  {
    id: "end-of-day-cutover",
    position: { x: 220, y: 470 },
    data: {
      termZh: "日切",
      termEn: "Business Date Rollover",
      domainZh: "交易系统运行与账务批处理",
      domainEn: "Trading System Operations and Batch Processing",
      scopeZh: "系统业务日期切换",
      scopeEn: "Operational business-date transition",
      definitionZh:
        "日切是系统从一个业务日期切换到下一个业务日期的运行过程，通常伴随批量结算、账务汇总、对账和报表生成。它不是清算到交收链路中天然固定的一步，具体含义取决于系统边界和机构用语。",
      definitionEn:
        "Business date rollover is the operational transition from one business date to the next, often accompanied by batch posting, reconciliation, reporting, and end-of-day controls. Terminology varies across institutions and systems.",
      exampleZh:
        "某交易系统可在日切窗口暂停新交易写入，完成当日账务汇总后再开放下一业务日。",
      status: "needs_review",
      confidence: 0.71,
      sourceCount: 2,
      createdAt: "2026-11-16",
    },
  },
  {
    id: "dvp",
    position: { x: 720, y: 100 },
    data: {
      termZh: "券款对付",
      termEn: "Delivery versus Payment (DvP)",
      domainZh: "证券交收风险控制",
      domainEn: "Securities Settlement Risk Controls",
      scopeZh: "证券交付与资金支付的条件联动",
      scopeEn: "Conditional linkage of securities delivery and payment",
      definitionZh: "点亮后将联网验证并生成完整解释。",
      definitionEn: "Full researched explanation will be generated when activated.",
      exampleZh: "建议节点尚未生成正式案例。",
      status: "suggested",
      confidence: 0.92,
      suggestionReason: "它直接解释证券交收如何降低本金风险。",
    },
  },
  {
    id: "ccp",
    position: { x: 120, y: 40 },
    data: {
      termZh: "中央对手方",
      termEn: "Central Counterparty (CCP)",
      domainZh: "金融市场基础设施",
      domainEn: "Financial Market Infrastructure",
      scopeZh: "交易对手替代与集中风险管理",
      scopeEn: "Counterparty substitution and centralised risk management",
      definitionZh: "点亮后将联网验证并生成完整解释。",
      definitionEn: "Full researched explanation will be generated when activated.",
      exampleZh: "建议节点尚未生成正式案例。",
      status: "suggested",
      confidence: 0.87,
      suggestionReason: "它通常处在清算机制与风险管理的核心位置。",
    },
  },
  {
    id: "reconciliation",
    position: { x: 690, y: 430 },
    data: {
      termZh: "对账",
      termEn: "Reconciliation",
      domainZh: "交易后运营控制",
      domainEn: "Post-Trade Operational Controls",
      scopeZh: "跨系统记录一致性核对",
      scopeEn: "Cross-system record consistency checks",
      definitionZh: "点亮后将联网验证并生成完整解释。",
      definitionEn: "Full researched explanation will be generated when activated.",
      exampleZh: "建议节点尚未生成正式案例。",
      status: "suggested",
      confidence: 0.83,
      suggestionReason: "它是交收完成后发现差异与异常的重要控制。",
    },
  },
];

export const initialEdges: KnowledgeEdgeRecord[] = [
  { id: "clearing-settlement", source: "trade-clearing", target: "securities-settlement", relationType: "precedes", label: "先于", status: "confirmed" },
  { id: "settlement-dvp", source: "securities-settlement", target: "dvp", relationType: "enables", label: "由此控制风险", status: "proposed" },
  { id: "ccp-clearing", source: "ccp", target: "trade-clearing", relationType: "part_of", label: "参与清算", status: "proposed" },
  { id: "settlement-reconciliation", source: "securities-settlement", target: "reconciliation", relationType: "precedes", label: "后续核对", status: "proposed" },
  { id: "cutover-clearing", source: "end-of-day-cutover", target: "trade-clearing", relationType: "related_to", label: "批处理窗口", status: "proposed" },
];

export const knowledgeDocumentSchema = z.object({
  version: z.literal(1),
  nodes: z.array(knowledgeNodeRecordSchema),
  edges: z.array(knowledgeEdgeRecordSchema),
}).superRefine((document, context) => {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  document.nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `节点 ID 重复：${node.id}`,
        path: ["nodes", index, "id"],
      });
    }
    nodeIds.add(node.id);
  });

  document.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `关系 ID 重复：${edge.id}`,
        path: ["edges", index, "id"],
      });
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `关系 ${edge.id} 引用了不存在的节点`,
        path: ["edges", index],
      });
    }
  });
});

export type KnowledgeDocument = z.infer<typeof knowledgeDocumentSchema>;

export const initialDocument: KnowledgeDocument = {
  version: 1,
  nodes: initialNodes,
  edges: initialEdges,
};

export function createInitialDocument(): KnowledgeDocument {
  return {
    version: 1,
    nodes: initialNodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { ...node.data },
    })),
    edges: initialEdges.map((edge) => ({ ...edge })),
  };
}

export const statusLabel: Record<NodeStatus, string> = {
  confirmed: "已点亮",
  suggested: "待点亮",
  needs_review: "待校验",
};

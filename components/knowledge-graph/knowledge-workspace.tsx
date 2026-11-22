"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type Edge, type Node, type NodeMouseHandler, type OnNodesChange } from "@xyflow/react";
import {
  BookOpenText,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  GitFork,
  Network,
  Upload,
} from "lucide-react";
import {
  createInitialDocument,
  knowledgeDocumentSchema,
  type KnowledgeDocument,
  type KnowledgeNodeData,
  type KnowledgeNodeRecord,
} from "@/lib/knowledge";
import { LocalStorageKnowledgeRepository } from "@/lib/knowledge-repository";
import { integrateGenerationResult } from "@/lib/integrate-generation";
import {
  termGenerationErrorSchema,
  termGenerationResultSchema,
  type ContextOption,
} from "@/lib/term-generation";
import { ContextChooser } from "./context-chooser";
import { NodeDetailPanel } from "./node-detail-panel";
import { RelationshipGraph } from "./relationship-graph";
import { TermInput } from "./term-input";

type PipelineStage = "idle" | "checking" | "context" | "researching" | "composing";

const stageCopy: Record<Exclude<PipelineStage, "idle">, string> = {
  checking: "检查术语与可能的规范名称",
  context: "判断行业与具体语境",
  researching: "检索专业来源并交叉验证",
  composing: "生成双语节点与关系",
};

const repository = new LocalStorageKnowledgeRepository();

type PendingContext = {
  term: string;
  targetNodeId?: string;
  options: ContextOption[];
};

function toFlowNodes(records: KnowledgeNodeRecord[]): Node[] {
  return records.map((node) => ({ ...node, type: "knowledge" }));
}

function toFlowEdges(document: KnowledgeDocument): Edge[] {
  return document.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: "smoothstep",
    animated: edge.status === "proposed",
    className: edge.status === "proposed" ? "edge-proposed" : "edge-confirmed",
    style: { strokeWidth: 1.8 },
    labelStyle: { fontSize: 11, fontWeight: 650, fill: "#344039" },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.97 },
    labelBgPadding: [6, 4],
    labelBgBorderRadius: 10,
  }));
}

const railButton = "grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-[#4e5952] hover:bg-white hover:text-[#111a15]";
const utilityButton = "flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#aeb8af] bg-white px-2.5 text-[11px] font-semibold text-[#3f4b44] hover:bg-[#eef2ec]";

export function KnowledgeWorkspace() {
  const [knowledgeDocument, setKnowledgeDocument] = useState<KnowledgeDocument>(createInitialDocument);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState("securities-settlement");
  const [keyword, setKeyword] = useState("");
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [detailOpen, setDetailOpen] = useState(true);
  const [notice, setNotice] = useState("正在读取浏览器本地数据");
  const [pendingContext, setPendingContext] = useState<PendingContext | null>(null);

  useEffect(() => {
    const storedDocument = repository.load();
    setKnowledgeDocument(storedDocument);
    setSelectedId(storedDocument.nodes[0]?.id ?? "");
    setDetailOpen(storedDocument.nodes.length > 0);
    setHydrated(true);
    setNotice("数据已从浏览器本地存储载入");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const result = repository.save(knowledgeDocument);
    if (!result.ok) setNotice(result.message);
  }, [hydrated, knowledgeDocument]);

  const nodes = useMemo(() => toFlowNodes(knowledgeDocument.nodes), [knowledgeDocument.nodes]);
  const edges = useMemo(() => toFlowEdges(knowledgeDocument), [knowledgeDocument]);
  const selectedRecord = useMemo(
    () => knowledgeDocument.nodes.find((node) => node.id === selectedId),
    [knowledgeDocument.nodes, selectedId],
  );

  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedId(node.id);
    setDetailOpen(true);
  }, []);

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    const positions = new Map(
      changes.flatMap((change) => (
        change.type === "position" && change.position
          ? [[change.id, change.position] as const]
          : []
      )),
    );

    if (positions.size === 0) return;
    setKnowledgeDocument((current) => ({
      ...current,
      nodes: current.nodes.map((node) => {
        const position = positions.get(node.id);
        return position ? { ...node, position } : node;
      }),
    }));
  }, []);

  function updateSelectedNode(patch: Partial<KnowledgeNodeData>) {
    if (!selectedId) return;
    setKnowledgeDocument((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (
        node.id === selectedId ? { ...node, data: { ...node.data, ...patch } } : node
      )),
    }));
    setNotice("节点修改已保存到浏览器");
  }

  function deleteSelectedNode() {
    if (!selectedRecord || !window.confirm(`确定删除“${selectedRecord.data.termZh}”及其关联关系吗？`)) return;

    const remainingNodes = knowledgeDocument.nodes.filter((node) => node.id !== selectedId);
    setKnowledgeDocument((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== selectedId),
      edges: current.edges.filter((edge) => edge.source !== selectedId && edge.target !== selectedId),
    }));
    setSelectedId(remainingNodes[0]?.id ?? "");
    setDetailOpen(remainingNodes.length > 0);
    setNotice("节点及其关联关系已删除");
  }

  function exportDocument() {
    const blob = new Blob([JSON.stringify(knowledgeDocument, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `fomo-knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("知识图谱 JSON 已导出");
  }

  async function importDocument(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = knowledgeDocumentSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success) {
        setNotice(`导入失败：${parsed.error.issues[0]?.message ?? "JSON 格式不符合要求"}`);
        return;
      }

      setKnowledgeDocument(parsed.data);
      setSelectedId(parsed.data.nodes[0]?.id ?? "");
      setDetailOpen(parsed.data.nodes.length > 0);
      setNotice(`已导入 ${parsed.data.nodes.length} 个节点和 ${parsed.data.edges.length} 条关系`);
    } catch {
      setNotice("导入失败：文件不是有效的 JSON");
    }
  }

  async function runGeneration(
    term: string,
    context?: ContextOption,
    targetNodeId?: string,
  ) {
    setPendingContext(null);
    setNotice(context ? `正在按“${context.labelZh}”语境研究` : "正在检查术语、语境和专业来源");
    setStage("researching");

    try {
      const response = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term,
          contextId: context?.id ?? null,
          contextLabel: context ? `${context.labelZh} / ${context.labelEn}` : null,
          existingNodes: knowledgeDocument.nodes
            .filter((node) => node.id !== targetNodeId)
            .slice(0, 100)
            .map((node) => ({
              id: node.id,
              termZh: node.data.termZh,
              termEn: node.data.termEn,
              domainZh: node.data.domainZh,
              scopeZh: node.data.scopeZh,
              status: node.data.status,
            })),
        }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const parsedError = termGenerationErrorSchema.safeParse(body);
        throw new Error(parsedError.success ? parsedError.data.error.message : "术语研究服务请求失败。");
      }

      const parsed = termGenerationResultSchema.safeParse(body);
      if (!parsed.success) throw new Error("服务端返回的数据没有通过结构校验。");
      const result = parsed.data;

      if (result.kind === "context_required") {
        setPendingContext({ term, targetNodeId, options: result.options });
        setNotice("请选择术语所在的专业语境");
        return;
      }

      setStage("composing");
      const newNodeId = targetNodeId ?? `node-${crypto.randomUUID()}`;
      setKnowledgeDocument((current) => {
        const integrated = integrateGenerationResult(current, result, targetNodeId, newNodeId);
        return integrated.document;
      });
      setSelectedId(newNodeId);
      setDetailOpen(true);
      setKeyword("");
      const warning = result.warnings[0];
      const correction = result.correctionReason.trim()
        ? `已规范为“${result.normalizedTerm}”：${result.correctionReason}`
        : "";
      setNotice(warning || correction || `节点已生成，并补充 ${result.suggestions.length} 个待点亮概念`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "术语研究失败，现有数据没有被修改。");
    } finally {
      setStage("idle");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = keyword.trim();
    if (!term || stage !== "idle") return;

    const normalized = term.toLocaleLowerCase();
    const existing = knowledgeDocument.nodes.find((node) => (
      node.data.termZh.toLocaleLowerCase() === normalized
      || node.data.termEn.toLocaleLowerCase() === normalized
    ));

    if (existing?.data.status === "confirmed") {
      setSelectedId(existing.id);
      setDetailOpen(true);
      setNotice("已定位到现有节点，未重复创建");
      setKeyword("");
      return;
    }

    await runGeneration(term, undefined, existing?.id);
  }

  return (
    <main className="grid h-dvh w-screen grid-cols-[58px_minmax(0,1fr)] overflow-hidden bg-[#eef1eb] text-[#111a15] max-[740px]:grid-cols-1">
      <aside className="z-10 flex flex-col items-center border-r border-[#c8cec7] bg-[#dfe4dc] py-4 max-[740px]:hidden" aria-label="主导航">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111a15] font-serif text-lg font-bold text-white" aria-label="Fomo">F</div>
        <nav className="flex flex-1 flex-col gap-2 pt-9">
          <button className={`${railButton} bg-white text-[#1f654a] shadow-sm`} aria-label="知识图谱"><Network size={18} /></button>
          <button className={railButton} aria-label="节点列表"><BookOpenText size={18} /></button>
          <button className={railButton} aria-label="关系"><GitFork size={18} /></button>
        </nav>
        <button className={railButton} aria-label="帮助"><CircleHelp size={18} /></button>
      </aside>

      <section className="grid min-h-0 min-w-0 grid-rows-[72px_37px_minmax(0,1fr)_27px] max-[740px]:grid-rows-[auto_34px_minmax(0,1fr)_25px]">
        <header className="grid grid-cols-[minmax(170px,.7fr)_minmax(340px,700px)_minmax(220px,.7fr)] items-center gap-7 border-b border-[#c8cec7] bg-white/90 px-6 max-[740px]:grid-cols-1 max-[740px]:p-3.5">
          <div className="max-[740px]:hidden">
            <span className="text-[10px] font-bold tracking-[.12em] text-[#66716a]">PERSONAL KNOWLEDGE SYSTEM</span>
            <h1 className="mt-0.5 mb-0 font-serif text-[22px] font-semibold tracking-tight">术语图谱</h1>
          </div>
          <TermInput keyword={keyword} loading={stage !== "idle"} onKeywordChange={setKeyword} onSubmit={handleSubmit} />
          <div className="flex items-center justify-end gap-2 max-[980px]:hidden">
            <label className={utilityButton}>
              <Upload size={14} />导入 JSON
              <input className="sr-only" type="file" accept="application/json,.json" onChange={importDocument} />
            </label>
            <button className={utilityButton} onClick={exportDocument}><Download size={14} />导出 JSON</button>
          </div>
        </header>

        <div className="flex items-center justify-between border-b border-[#c8cec7] bg-[#f7f8f4] px-6 text-[11px] text-[#4f5b54]">
          <div className="flex items-center gap-1"><span>全部领域</span><ChevronRight size={13} /><strong>证券交易后处理</strong></div>
          <div className="flex gap-4 max-[740px]:hidden"><span>● 已点亮</span><span>○ 待点亮</span><span className="text-[#8b4d18]">● 待校验</span></div>
        </div>

        <div className={`relative grid min-h-0 min-w-0 ${detailOpen ? "grid-cols-[minmax(0,1fr)_minmax(330px,29vw)] max-[740px]:grid-cols-1 max-[740px]:grid-rows-[minmax(260px,.9fr)_minmax(300px,1.1fr)]" : "grid-cols-1"}`}>
          <RelationshipGraph nodes={nodes} edges={edges} notice={notice} stageMessage={stage === "idle" ? undefined : stageCopy[stage]} onNodeClick={handleNodeClick} onNodesChange={handleNodesChange} />
          {detailOpen && selectedRecord ? (
            <NodeDetailPanel key={selectedRecord.id} node={selectedRecord.data} onClose={() => setDetailOpen(false)} onUpdate={updateSelectedNode} onDelete={deleteSelectedNode} />
          ) : (
            knowledgeDocument.nodes.length > 0 && <button className="absolute top-4 right-4 z-10 rounded-lg border border-[#aeb8af] bg-white px-3 py-2 text-[11px] font-semibold" onClick={() => setDetailOpen(true)}>打开节点详情</button>
          )}
          {pendingContext && (
            <ContextChooser
              term={pendingContext.term}
              options={pendingContext.options}
              onSelect={(option) => runGeneration(pendingContext.term, option, pendingContext.targetNodeId)}
              onCancel={() => {
                setPendingContext(null);
                setNotice("已取消语境选择，图谱没有被修改");
              }}
            />
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-[#c8cec7] bg-[#dfe4dc] px-4 text-[10px] text-[#4f5b54]">
          <span>● 本地 JSON 数据</span><span className="h-2.5 w-px bg-[#b9c0b8]" /><span className="flex items-center gap-1"><Check size={12} />AI 结果校验后自动保存</span><span className="flex-1" /><span>Prototype 0.3</span>
        </footer>
      </section>
    </main>
  );
}

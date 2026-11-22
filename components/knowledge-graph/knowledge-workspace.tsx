"use client";

import { type FormEvent, useCallback, useMemo, useState } from "react";
import { type Edge, type Node, type NodeMouseHandler } from "@xyflow/react";
import {
  BookOpenText,
  Check,
  ChevronRight,
  CircleHelp,
  Command,
  GitFork,
  Network,
} from "lucide-react";
import {
  initialEdges,
  initialNodes,
  type KnowledgeNodeData,
  type KnowledgeNodeRecord,
} from "@/lib/knowledge";
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function toFlowNodes(records: KnowledgeNodeRecord[]): Node[] {
  return records.map((node) => ({ ...node, type: "knowledge" }));
}

const flowEdges: Edge[] = initialEdges.map((edge) => ({
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

const railButton = "grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-[#4e5952] hover:bg-white hover:text-[#111a15]";

export function KnowledgeWorkspace() {
  const [nodes, setNodes] = useState<Node[]>(() => toFlowNodes(initialNodes));
  const [selectedId, setSelectedId] = useState("securities-settlement");
  const [keyword, setKeyword] = useState("");
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [detailOpen, setDetailOpen] = useState(true);
  const [notice, setNotice] = useState("演示数据 · AI 研究服务尚未接入");

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedId),
    [nodes, selectedId],
  );
  const selected = selectedNode?.data as unknown as KnowledgeNodeData | undefined;

  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedId(node.id);
    setDetailOpen(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = keyword.trim();
    if (!term || stage !== "idle") return;

    setNotice("正在运行术语工作流");
    setStage("checking"); await sleep(520);
    setStage("context"); await sleep(580);
    setStage("researching"); await sleep(820);
    setStage("composing"); await sleep(620);

    const existing = nodes.find((node) => {
      const data = node.data as unknown as KnowledgeNodeData;
      return data.termZh.toLocaleLowerCase() === term.toLocaleLowerCase()
        || data.termEn.toLocaleLowerCase().includes(term.toLocaleLowerCase());
    });

    if (existing) {
      setSelectedId(existing.id);
      setDetailOpen(true);
      const data = existing.data as unknown as KnowledgeNodeData;
      if (data.status === "suggested") {
        setNodes((current) => current.map((node) => node.id === existing.id
          ? { ...node, data: { ...node.data, status: "needs_review", createdAt: new Date().toISOString().slice(0, 10) } }
          : node));
        setNotice("建议节点已进入校验队列");
      } else {
        setNotice("已定位到现有节点，未重复创建");
      }
    } else {
      const id = `draft-${Date.now()}`;
      setNodes((current) => [...current, {
        id,
        type: "knowledge",
        position: { x: 440, y: 40 },
        data: {
          termZh: term,
          termEn: "Pending professional verification",
          domainZh: "待判断具体领域",
          domainEn: "Domain pending verification",
          scopeZh: "等待研究服务补全",
          scopeEn: "Awaiting research service",
          definitionZh: "该节点已创建为待校验草稿。接入联网研究服务后，系统将在此补全专业定义、英文术语、案例和字段级来源。",
          definitionEn: "This draft is awaiting verified terminology, scope, evidence, and a bilingual explanation.",
          exampleZh: "当前版本不会用未经验证的内容冒充专业解释。",
          status: "needs_review",
          confidence: 0,
          sourceCount: 0,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      }]);
      setSelectedId(id);
      setDetailOpen(true);
      setNotice("已创建待校验草稿，没有生成未经验证的事实");
    }

    setKeyword("");
    setStage("idle");
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
        <header className="grid grid-cols-[minmax(170px,.7fr)_minmax(340px,700px)_minmax(130px,.7fr)] items-center gap-7 border-b border-[#c8cec7] bg-white/90 px-6 max-[740px]:grid-cols-1 max-[740px]:p-3.5">
          <div className="max-[740px]:hidden">
            <span className="text-[10px] font-bold tracking-[.12em] text-[#66716a]">PERSONAL KNOWLEDGE SYSTEM</span>
            <h1 className="mt-0.5 mb-0 font-serif text-[22px] font-semibold tracking-tight">术语图谱</h1>
          </div>
          <TermInput keyword={keyword} loading={stage !== "idle"} onKeywordChange={setKeyword} onSubmit={handleSubmit} />
          <div className="flex items-center justify-end gap-3 max-[980px]:hidden">
            <button className="flex h-8 items-center gap-1 rounded-lg border border-[#aeb8af] px-2 text-[11px] text-[#4f5b54]"><Command size={15} />K</button>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#ccdacf] text-[11px] font-bold text-[#244b37]">XR</div>
          </div>
        </header>

        <div className="flex items-center justify-between border-b border-[#c8cec7] bg-[#f7f8f4] px-6 text-[11px] text-[#4f5b54]">
          <div className="flex items-center gap-1"><span>全部领域</span><ChevronRight size={13} /><strong>证券交易后处理</strong></div>
          <div className="flex gap-4 max-[740px]:hidden"><span>● 已点亮</span><span>○ 待点亮</span><span className="text-[#8b4d18]">● 待校验</span></div>
        </div>

        <div className={`relative grid min-h-0 min-w-0 ${detailOpen ? "grid-cols-[minmax(0,1fr)_minmax(330px,29vw)] max-[740px]:grid-cols-1 max-[740px]:grid-rows-[minmax(260px,.9fr)_minmax(300px,1.1fr)]" : "grid-cols-1"}`}>
          <RelationshipGraph nodes={nodes} edges={flowEdges} notice={notice} stageMessage={stage === "idle" ? undefined : stageCopy[stage]} onNodeClick={handleNodeClick} />
          {detailOpen && selected ? (
            <NodeDetailPanel node={selected} onClose={() => setDetailOpen(false)} />
          ) : (
            <button className="absolute top-4 right-4 z-10 rounded-lg border border-[#aeb8af] bg-white px-3 py-2 text-[11px] font-semibold" onClick={() => setDetailOpen(true)}>打开节点详情</button>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-[#c8cec7] bg-[#dfe4dc] px-4 text-[10px] text-[#4f5b54]">
          <span>● 原型数据</span><span className="h-2.5 w-px bg-[#b9c0b8]" /><span className="flex items-center gap-1"><Check size={12} />当前会话内保存</span><span className="flex-1" /><span>Prototype 0.1</span>
        </footer>
      </section>
    </main>
  );
}

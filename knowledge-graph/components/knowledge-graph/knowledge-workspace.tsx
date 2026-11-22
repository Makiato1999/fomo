"use client";

import { type FormEvent, useCallback, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import {
  ArrowRight,
  BookOpenText,
  Check,
  ChevronRight,
  CircleHelp,
  Command,
  CornerDownLeft,
  ExternalLink,
  GitFork,
  Languages,
  LoaderCircle,
  Network,
  PanelRightClose,
  Search,
  Sparkles,
} from "lucide-react";
import { TermNode } from "./term-node";
import {
  initialEdges,
  initialNodes,
  statusLabel,
  type KnowledgeNodeData,
  type KnowledgeNodeRecord,
} from "@/lib/knowledge";

type PipelineStage = "idle" | "checking" | "context" | "researching" | "composing";

const stageCopy: Record<Exclude<PipelineStage, "idle">, string> = {
  checking: "检查术语与可能的规范名称",
  context: "判断行业与具体语境",
  researching: "检索专业来源并交叉验证",
  composing: "生成双语节点与关系",
};

const nodeTypes = { knowledge: TermNode };
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = keyword.trim();
    if (!term || stage !== "idle") return;

    setNotice("正在运行术语工作流");
    setStage("checking");
    await sleep(520);
    setStage("context");
    await sleep(580);
    setStage("researching");
    await sleep(820);
    setStage("composing");
    await sleep(620);

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
          ? {
              ...node,
              data: {
                ...node.data,
                status: "needs_review",
                createdAt: new Date().toISOString().slice(0, 10),
              },
            }
          : node));
        setNotice("建议节点已进入校验队列");
      } else {
        setNotice("已定位到现有节点，未重复创建");
      }
    } else {
      const id = `draft-${Date.now()}`;
      const draft: Node = {
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
      };
      setNodes((current) => [...current, draft]);
      setSelectedId(id);
      setDetailOpen(true);
      setNotice("已创建待校验草稿，没有生成未经验证的事实");
    }

    setKeyword("");
    setStage("idle");
  };

  return (
    <main className="app-shell">
      <aside className="rail" aria-label="主导航">
        <div className="brand-mark" aria-label="Fomo"><span>F</span></div>
        <nav className="rail-nav">
          <button className="rail-button is-active" aria-label="知识图谱"><Network size={18} /></button>
          <button className="rail-button" aria-label="节点列表"><BookOpenText size={18} /></button>
          <button className="rail-button" aria-label="关系"><GitFork size={18} /></button>
        </nav>
        <button className="rail-button rail-help" aria-label="帮助"><CircleHelp size={18} /></button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="title-block">
            <span className="eyebrow">PERSONAL KNOWLEDGE SYSTEM</span>
            <h1>术语图谱</h1>
          </div>

          <form className="term-search" onSubmit={handleSubmit}>
            <Search size={17} aria-hidden="true" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="输入一个专业术语，如：券款对付"
              aria-label="输入专业术语"
              disabled={stage !== "idle"}
            />
            <button type="submit" disabled={!keyword.trim() || stage !== "idle"}>
              {stage === "idle" ? <CornerDownLeft size={15} /> : <LoaderCircle size={15} className="spin" />}
              <span>{stage === "idle" ? "建立节点" : "研究中"}</span>
            </button>
          </form>

          <div className="top-actions">
            <button className="command-button" aria-label="打开命令面板"><Command size={15} /><span>K</span></button>
            <div className="avatar">XR</div>
          </div>
        </header>

        <div className="context-bar">
          <div className="breadcrumb"><span>全部领域</span><ChevronRight size={13} /><strong>证券交易后处理</strong></div>
          <div className="legend">
            <span><i className="legend-dot confirmed" />已点亮</span>
            <span><i className="legend-dot suggested" />待点亮</span>
            <span><i className="legend-dot review" />待校验</span>
          </div>
        </div>

        <div className={`content-grid ${detailOpen ? "has-detail" : ""}`}>
          <section className="graph-panel" aria-label="知识图谱">
            <div className="graph-kicker"><span>{nodes.length} 个概念</span><span>·</span><span>{flowEdges.length} 条关系</span></div>
            <ReactFlow
              nodes={nodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              onNodeClick={handleNodeClick}
              fitView
              fitViewOptions={{ padding: 0.22 }}
              minZoom={0.45}
              maxZoom={1.65}
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#c4cbc3" />
              <Controls position="bottom-left" showInteractive={false} />
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                nodeColor={(node) => {
                  const data = node.data as unknown as KnowledgeNodeData;
                  if (data.status === "confirmed") return "#33755d";
                  if (data.status === "needs_review") return "#b9783f";
                  return "#8f978f";
                }}
              />
            </ReactFlow>

            <div className="graph-notice" aria-live="polite">
              {stage === "idle"
                ? <><span className="notice-pulse" />{notice}</>
                : <><LoaderCircle size={14} className="spin" />{stageCopy[stage]}</>}
            </div>
          </section>

          {detailOpen && selected ? (
            <aside className="detail-panel" aria-label="节点详情">
              <div className="detail-head">
                <div>
                  <span className={`status-chip status-chip--${selected.status}`}>{statusLabel[selected.status]}</span>
                  <h2>{selected.termZh}</h2>
                  <p className="detail-term-en">{selected.termEn}</p>
                </div>
                <button onClick={() => setDetailOpen(false)} aria-label="关闭详情"><PanelRightClose size={18} /></button>
              </div>

              {selected.status === "suggested" && (
                <div className="suggestion-callout">
                  <Sparkles size={16} />
                  <div><strong>为什么推荐</strong><p>{selected.suggestionReason}</p></div>
                </div>
              )}

              <div className="detail-section domain-card">
                <div><span>领域 / DOMAIN</span><strong>{selected.domainZh}</strong><p>{selected.domainEn}</p></div>
                <ArrowRight size={17} />
                <div><span>范围 / SCOPE</span><strong>{selected.scopeZh}</strong><p>{selected.scopeEn}</p></div>
              </div>

              <div className="detail-section">
                <div className="section-title"><Languages size={15} /><h3>解释</h3></div>
                <p className="body-copy">{selected.definitionZh}</p>
                <p className="english-copy">{selected.definitionEn}</p>
              </div>

              <div className="detail-section">
                <div className="section-title"><BookOpenText size={15} /><h3>例子</h3></div>
                <p className="example-copy">{selected.exampleZh}</p>
              </div>

              <div className="detail-footer">
                <div><span>可信度</span><strong>{Math.round((selected.confidence ?? 0) * 100)}%</strong></div>
                <div><span>来源</span><strong>{selected.sourceCount ?? 0} 个</strong></div>
                <div><span>创建</span><strong>{selected.createdAt ?? "尚未点亮"}</strong></div>
              </div>

              <button className="sources-button">查看字段级来源<ExternalLink size={14} /></button>
            </aside>
          ) : (
            <button className="open-detail" onClick={() => setDetailOpen(true)}>打开节点详情</button>
          )}
        </div>

        <footer className="statusbar">
          <span><i className="notice-pulse" />原型数据</span>
          <span className="status-separator" />
          <span><Check size={12} />当前会话内保存</span>
          <span className="status-spacer" />
          <span>Prototype 0.1</span>
        </footer>
      </section>
    </main>
  );
}

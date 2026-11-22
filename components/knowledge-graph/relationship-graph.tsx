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
import { LoaderCircle } from "lucide-react";
import type { KnowledgeNodeData } from "@/lib/knowledge";
import { TermNode } from "./term-node";

const nodeTypes = { knowledge: TermNode };

type RelationshipGraphProps = {
  nodes: Node[];
  edges: Edge[];
  notice: string;
  stageMessage?: string;
  onNodeClick: NodeMouseHandler;
};

export function RelationshipGraph({
  nodes,
  edges,
  notice,
  stageMessage,
  onNodeClick,
}: RelationshipGraphProps) {
  return (
    <section className="relative min-h-0 min-w-0 bg-[#eef1eb]" aria-label="知识图谱">
      <div className="absolute top-3.5 left-4 z-10 flex gap-1.5 rounded-full border border-[#aeb8af] bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-[#455048]">
        <span>{nodes.length} 个概念</span><span>·</span><span>{edges.length} 条关系</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
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

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#aeb8af] bg-white/95 px-3 py-2 text-[11px] font-medium text-[#3f4b44] shadow-md" aria-live="polite">
        {stageMessage ? (
          <><LoaderCircle size={14} className="animate-spin" />{stageMessage}</>
        ) : (
          <><span className="h-1.5 w-1.5 rounded-full bg-[#6f9c86]" />{notice}</>
        )}
      </div>
    </section>
  );
}

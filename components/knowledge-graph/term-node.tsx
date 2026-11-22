"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, Sparkles, TriangleAlert } from "lucide-react";
import type { KnowledgeNodeData } from "@/lib/knowledge";

const statusIcon = {
  confirmed: Check,
  suggested: Sparkles,
  needs_review: TriangleAlert,
};

export function TermNode({ data, selected }: NodeProps) {
  const term = data as unknown as KnowledgeNodeData;
  const Icon = statusIcon[term.status];
  const statusClass = {
    confirmed: "border-l-[3px] border-l-[#1f654a]",
    suggested: "border-dashed border-[#737d76] bg-[#f6f8f3] text-[#3e4942] shadow-none",
    needs_review: "border-l-[3px] border-l-[#8b4d18]",
  }[term.status];

  return (
    <div className={`w-[220px] min-h-24 rounded-xl border border-[#aeb8af] bg-white px-4 py-3.5 shadow-md transition hover:-translate-y-px ${statusClass} ${selected ? "ring-3 ring-[#1f654a]/20 border-[#1f654a]" : ""}`}>
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border !border-white !bg-[#83958b]" />
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-[#536058]">
        <span className="truncate">{term.domainZh}</span>
        <Icon size={13} strokeWidth={2} aria-hidden="true" />
      </div>
      <p className="mt-2.5 mb-1 font-serif text-[19px] leading-tight font-semibold">{term.termZh}</p>
      <p className="m-0 truncate text-[11px] text-[#4e5a53]">{term.termEn}</p>
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border !border-white !bg-[#83958b]" />
    </div>
  );
}

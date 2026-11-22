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

  return (
    <div className={`term-node term-node--${term.status} ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} className="term-handle" />
      <div className="term-node__meta">
        <span>{term.domainZh}</span>
        <Icon size={13} strokeWidth={2} aria-hidden="true" />
      </div>
      <p className="term-node__zh">{term.termZh}</p>
      <p className="term-node__en">{term.termEn}</p>
      <Handle type="source" position={Position.Right} className="term-handle" />
    </div>
  );
}

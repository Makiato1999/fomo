import {
  ArrowRight,
  BookOpenText,
  ExternalLink,
  Languages,
  PanelRightClose,
  Sparkles,
} from "lucide-react";
import { statusLabel, type KnowledgeNodeData } from "@/lib/knowledge";

const statusClass = {
  confirmed: "bg-[#dcece3] text-[#1f654a]",
  suggested: "border border-dashed border-[#737d76] text-[#414c45]",
  needs_review: "bg-[#f3e1ce] text-[#8b4d18]",
};

type NodeDetailPanelProps = {
  node: KnowledgeNodeData;
  onClose: () => void;
};

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  return (
    <aside className="z-10 min-w-0 overflow-y-auto border-l border-[#c8cec7] bg-white px-6 pt-6 pb-7 max-[740px]:border-t max-[740px]:border-l-0 max-[740px]:p-4" aria-label="节点详情">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${statusClass[node.status]}`}>
            {statusLabel[node.status]}
          </span>
          <h2 className="mt-3 mb-0.5 font-serif text-[29px] font-semibold tracking-[-0.035em]">{node.termZh}</h2>
          <p className="m-0 text-xs font-medium text-[#1f654a]">{node.termEn}</p>
        </div>
        <button className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#aeb8af] text-[#4f5b54] hover:bg-[#eef2ec]" onClick={onClose} aria-label="关闭详情">
          <PanelRightClose size={18} />
        </button>
      </div>

      {node.status === "suggested" && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed border-[#9aa39b] bg-[#f1f4ee] p-3 text-[#3f4a43]">
          <Sparkles size={16} />
          <div><strong className="text-xs">为什么推荐</strong><p className="mt-1 mb-0 text-xs leading-relaxed">{node.suggestionReason}</p></div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-start gap-3 rounded-xl border border-[#d5dad3] bg-[#edf1ea] p-3.5">
        <div><span className="text-[10px] font-bold text-[#5b675f]">领域 / DOMAIN</span><strong className="mt-1.5 block font-serif text-sm">{node.domainZh}</strong><p className="mt-1 mb-0 text-[11px] text-[#566159]">{node.domainEn}</p></div>
        <ArrowRight size={17} className="mt-5 text-[#68736c]" />
        <div><span className="text-[10px] font-bold text-[#5b675f]">范围 / SCOPE</span><strong className="mt-1.5 block font-serif text-sm">{node.scopeZh}</strong><p className="mt-1 mb-0 text-[11px] text-[#566159]">{node.scopeEn}</p></div>
      </div>

      <section className="mt-5 border-t border-[#c8cec7] pt-5">
        <div className="flex items-center gap-2 text-[#3f4b44]"><Languages size={15} /><h3 className="m-0 text-[13px] font-bold">解释</h3></div>
        <p className="mt-3 mb-0 font-serif text-[15px] leading-[1.8] text-[#27312b]">{node.definitionZh}</p>
        <p className="mt-3 mb-0 border-l-3 border-[#a8b9ad] pl-3 font-serif text-[12.5px] leading-relaxed text-[#4d5851]">{node.definitionEn}</p>
      </section>

      <section className="mt-5 border-t border-[#c8cec7] pt-5">
        <div className="flex items-center gap-2 text-[#3f4b44]"><BookOpenText size={15} /><h3 className="m-0 text-[13px] font-bold">例子</h3></div>
        <p className="mt-3 mb-0 rounded-lg bg-[#edf1eb] p-3 text-[12.5px] leading-relaxed text-[#3f4a43]">{node.exampleZh}</p>
      </section>

      <div className="mt-5 grid grid-cols-[0.8fr_0.8fr_1.4fr] border-y border-[#c8cec7] py-3 text-[10px]">
        <div><span className="block text-[#68736c]">可信度</span><strong className="text-[11px] text-[#344039]">{Math.round((node.confidence ?? 0) * 100)}%</strong></div>
        <div><span className="block text-[#68736c]">来源</span><strong className="text-[11px] text-[#344039]">{node.sourceCount ?? 0} 个</strong></div>
        <div><span className="block text-[#68736c]">创建</span><strong className="text-[11px] text-[#344039]">{node.createdAt ?? "尚未点亮"}</strong></div>
      </div>

      <button className="mt-3.5 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#aeb8af] text-[11px] font-semibold text-[#3f4b44] hover:bg-[#f1f3ee]">
        查看字段级来源<ExternalLink size={14} />
      </button>
    </aside>
  );
}

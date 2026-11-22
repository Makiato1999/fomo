import { useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  ExternalLink,
  Languages,
  PanelRightClose,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  knowledgeNodeDataSchema,
  statusLabel,
  type KnowledgeNodeData,
  type NodeStatus,
} from "@/lib/knowledge";

const statusClass = {
  confirmed: "bg-[#dcece3] text-[#1f654a]",
  suggested: "border border-dashed border-[#737d76] text-[#414c45]",
  needs_review: "bg-[#f3e1ce] text-[#8b4d18]",
};

const fieldClass = "mt-1.5 w-full rounded-md border border-[#aeb8af] bg-white px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-[#2f6f55]";

type EditFieldProps = {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
};

function EditField({ label, value, multiline = false, onChange }: EditFieldProps) {
  return (
    <label className="block text-[10px] font-bold text-[#566159]">
      {label}
      {multiline ? (
        <textarea className={`${fieldClass} min-h-24 resize-y font-normal`} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={`${fieldClass} font-normal`} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

type NodeDetailPanelProps = {
  node: KnowledgeNodeData;
  onClose: () => void;
  onUpdate: (patch: Partial<KnowledgeNodeData>) => void;
  onDelete: () => void;
};

export function NodeDetailPanel({ node, onClose, onUpdate, onDelete }: NodeDetailPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node);
  const [error, setError] = useState("");

  function updateDraft<K extends keyof KnowledgeNodeData>(key: K, value: KnowledgeNodeData[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function cancelEditing() {
    setDraft(node);
    setError("");
    setEditing(false);
  }

  function saveEditing() {
    const parsed = knowledgeNodeDataSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "请检查节点字段");
      return;
    }

    onUpdate(parsed.data);
    setDraft(parsed.data);
    setError("");
    setEditing(false);
  }

  if (editing) {
    return (
      <aside className="z-10 min-w-0 overflow-y-auto border-l border-[#c8cec7] bg-white px-6 pt-6 pb-7 max-[740px]:border-t max-[740px]:border-l-0 max-[740px]:p-4" aria-label="编辑节点">
        <div className="flex items-center justify-between border-b border-[#c8cec7] pb-4">
          <div>
            <span className="text-[10px] font-bold tracking-[.1em] text-[#66716a]">EDIT NODE</span>
            <h2 className="mt-1 mb-0 font-serif text-xl font-semibold">编辑节点</h2>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-lg border border-[#aeb8af] text-[#4f5b54] hover:bg-[#eef2ec]" onClick={cancelEditing} aria-label="取消编辑"><X size={17} /></button>
        </div>

        <div className="mt-4 grid gap-4">
          <EditField label="关键词（中文）" value={draft.termZh} onChange={(value) => updateDraft("termZh", value)} />
          <EditField label="TERM（ENGLISH）" value={draft.termEn} onChange={(value) => updateDraft("termEn", value)} />
          <div className="grid grid-cols-2 gap-3">
            <EditField label="领域（中文）" value={draft.domainZh} onChange={(value) => updateDraft("domainZh", value)} />
            <EditField label="DOMAIN（ENGLISH）" value={draft.domainEn} onChange={(value) => updateDraft("domainEn", value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditField label="范围（中文）" value={draft.scopeZh} onChange={(value) => updateDraft("scopeZh", value)} />
            <EditField label="SCOPE（ENGLISH）" value={draft.scopeEn} onChange={(value) => updateDraft("scopeEn", value)} />
          </div>
          <EditField label="中文解释" value={draft.definitionZh} multiline onChange={(value) => updateDraft("definitionZh", value)} />
          <EditField label="ENGLISH DESCRIPTION" value={draft.definitionEn} multiline onChange={(value) => updateDraft("definitionEn", value)} />
          <EditField label="案例（中文）" value={draft.exampleZh} multiline onChange={(value) => updateDraft("exampleZh", value)} />
          <EditField label="EXAMPLE（ENGLISH）" value={draft.exampleEn ?? ""} multiline onChange={(value) => updateDraft("exampleEn", value || undefined)} />
          <label className="block text-[10px] font-bold text-[#566159]">
            状态
            <select className={fieldClass} value={draft.status} onChange={(event) => updateDraft("status", event.target.value as NodeStatus)}>
              <option value="confirmed">已点亮</option>
              <option value="suggested">待点亮</option>
              <option value="needs_review">待校验</option>
            </select>
          </label>
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-[#a13d2d]">{error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#aeb8af] text-xs font-semibold hover:bg-[#eef2ec]" onClick={cancelEditing}><X size={14} />取消</button>
          <button className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#173f30] text-xs font-semibold text-white hover:bg-[#245c47]" onClick={saveEditing}><Save size={14} />保存</button>
        </div>
      </aside>
    );
  }

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
        <div className="flex gap-1.5">
          <button className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#aeb8af] text-[#4f5b54] hover:bg-[#eef2ec]" onClick={() => setEditing(true)} aria-label="编辑节点"><Pencil size={16} /></button>
          <button className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#aeb8af] text-[#4f5b54] hover:bg-[#eef2ec]" onClick={onClose} aria-label="关闭详情"><PanelRightClose size={18} /></button>
        </div>
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
        {node.exampleEn && <p className="mt-2 mb-0 border-l-3 border-[#a8b9ad] pl-3 text-[11.5px] leading-relaxed text-[#566159]">{node.exampleEn}</p>}
      </section>

      <div className="mt-5 grid grid-cols-[0.8fr_0.8fr_1.4fr] border-y border-[#c8cec7] py-3 text-[10px]">
        <div><span className="block text-[#68736c]">可信度</span><strong className="text-[11px] text-[#344039]">{Math.round((node.confidence ?? 0) * 100)}%</strong></div>
        <div><span className="block text-[#68736c]">来源</span><strong className="text-[11px] text-[#344039]">{node.sourceCount ?? 0} 个</strong></div>
        <div><span className="block text-[#68736c]">创建</span><strong className="text-[11px] text-[#344039]">{node.createdAt ?? "尚未点亮"}</strong></div>
      </div>

      {(node.sources?.length ?? 0) > 0 && (
        <section className="mt-5 border-t border-[#c8cec7] pt-5">
          <div className="flex items-center gap-2 text-[#3f4b44]"><ExternalLink size={15} /><h3 className="m-0 text-[13px] font-bold">专业来源</h3></div>
          <div className="mt-3 grid gap-2">
            {node.sources?.map((source) => (
              <a className="block border border-[#d3d8d2] p-3 text-[#27312b] hover:border-[#2b7658] hover:bg-[#f3f6f2]" href={source.url} key={source.url} target="_blank" rel="noreferrer">
                <span className="flex items-start justify-between gap-3">
                  <strong className="text-xs leading-relaxed">{source.title}</strong>
                  <span className="shrink-0 bg-[#dcece3] px-1.5 py-0.5 text-[9px] font-bold text-[#1f654a]">{source.level}</span>
                </span>
                <span className="mt-1 block text-[10px] text-[#647068]">{source.publisher} · {source.sourceType}</span>
                <span className="mt-1.5 block text-[11px] leading-relaxed text-[#4d5851]">{source.evidenceSummary}</span>
              </a>
            ))}
          </div>
        </section>
      )}
      <button className="mt-2 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#c9a69f] text-[11px] font-semibold text-[#913e32] hover:bg-[#f8eeeb]" onClick={onDelete}>
        <Trash2 size={14} />删除节点
      </button>
    </aside>
  );
}

import { CircleHelp, X } from "lucide-react";
import type { ContextOption } from "@/lib/term-generation";

type ContextChooserProps = {
  term: string;
  options: ContextOption[];
  onSelect: (option: ContextOption) => void;
  onCancel: () => void;
};

export function ContextChooser({ term, options, onSelect, onCancel }: ContextChooserProps) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-[#17221b]/35 p-5">
      <section className="w-full max-w-lg border border-[#aeb8af] bg-white p-5 shadow-xl" aria-label="选择术语语境">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <CircleHelp className="mt-0.5 shrink-0 text-[#2b7658]" size={19} />
            <div>
              <h2 className="m-0 font-serif text-xl font-semibold">“{term}”需要确认语境</h2>
              <p className="mt-1.5 mb-0 text-xs leading-relaxed text-[#566159]">不同语境会改变英文术语、定义和关系位置。请选择你现在想了解的含义。</p>
            </div>
          </div>
          <button className="grid h-8 w-8 shrink-0 place-items-center border border-[#aeb8af] text-[#4f5b54] hover:bg-[#eef2ec]" onClick={onCancel} aria-label="取消语境选择"><X size={16} /></button>
        </div>
        <div className="mt-4 grid gap-2">
          {options.map((option) => (
            <button className="border border-[#c8cec7] p-3 text-left hover:border-[#2b7658] hover:bg-[#eef4f0]" key={option.id} onClick={() => onSelect(option)}>
              <strong className="block text-sm text-[#18251e]">{option.labelZh}</strong>
              <span className="mt-0.5 block text-[11px] font-semibold text-[#2b7658]">{option.labelEn}</span>
              <span className="mt-1.5 block text-xs leading-relaxed text-[#566159]">{option.descriptionZh}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

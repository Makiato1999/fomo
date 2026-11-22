import type { FormEvent } from "react";
import { CornerDownLeft, LoaderCircle, Search } from "lucide-react";

type TermInputProps = {
  keyword: string;
  loading: boolean;
  onKeywordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TermInput({ keyword, loading, onKeywordChange, onSubmit }: TermInputProps) {
  return (
    <form
      className="flex h-11 items-center gap-2.5 rounded-xl border border-[#aeb8af] bg-white py-0 pr-1.5 pl-3.5 shadow-sm focus-within:border-[#2b7658] focus-within:ring-3 focus-within:ring-[#2b7658]/15"
      onSubmit={onSubmit}
    >
      <Search size={17} className="shrink-0 text-[#5e6a63]" aria-hidden="true" />
      <input
        className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#111a15] outline-none placeholder:text-[#737d76]"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="输入一个专业术语，如：券款对付"
        aria-label="输入专业术语"
        disabled={loading}
      />
      <button
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-[#111a15] px-3 text-[11px] font-semibold text-white hover:bg-[#1f654a] disabled:cursor-not-allowed disabled:opacity-45"
        type="submit"
        disabled={!keyword.trim() || loading}
      >
        {loading ? <LoaderCircle size={15} className="animate-spin" /> : <CornerDownLeft size={15} />}
        <span>{loading ? "研究中" : "建立节点"}</span>
      </button>
    </form>
  );
}

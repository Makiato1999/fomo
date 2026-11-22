import {
  createInitialDocument,
  knowledgeDocumentSchema,
  type KnowledgeDocument,
} from "@/lib/knowledge";

const DEFAULT_STORAGE_KEY = "fomo.knowledge-document.v1";

export type SaveResult =
  | { ok: true }
  | { ok: false; message: string };

export interface KnowledgeRepository {
  load(): KnowledgeDocument;
  save(document: KnowledgeDocument): SaveResult;
}

export class LocalStorageKnowledgeRepository implements KnowledgeRepository {
  constructor(private readonly storageKey = DEFAULT_STORAGE_KEY) {}

  load(): KnowledgeDocument {
    if (typeof window === "undefined") return createInitialDocument();

    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) return createInitialDocument();

      const parsed = knowledgeDocumentSchema.safeParse(JSON.parse(stored));
      return parsed.success ? parsed.data : createInitialDocument();
    } catch {
      return createInitialDocument();
    }
  }

  save(document: KnowledgeDocument): SaveResult {
    if (typeof window === "undefined") return { ok: true };

    const parsed = knowledgeDocumentSchema.safeParse(document);
    if (!parsed.success) {
      return { ok: false, message: "节点数据未通过格式校验" };
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(parsed.data));
      return { ok: true };
    } catch {
      return { ok: false, message: "浏览器本地存储写入失败" };
    }
  }
}

import type {
  KnowledgeDocument,
  KnowledgeEdgeRecord,
  KnowledgeNodeRecord,
  NodeStatus,
} from "@/lib/knowledge";
import type { GeneratedSuggestion, TermGenerationResult } from "@/lib/term-generation";

const relationLabel: Record<GeneratedSuggestion["relationType"], string> = {
  precedes: "先于",
  follows: "后于",
  depends_on: "依赖",
  is_a: "属于",
  part_of: "组成部分",
  enables: "支持",
  contrasts_with: "易混对比",
  related_to: "相关",
};

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function suggestionNode(
  suggestion: GeneratedSuggestion,
  anchor: KnowledgeNodeRecord,
  index: number,
): KnowledgeNodeRecord {
  const angle = ((index + 1) / 5) * Math.PI * 2;
  return {
    id: `suggestion-${anchor.id}-${hashText(`${suggestion.termZh}|${suggestion.termEn}`)}`,
    position: {
      x: anchor.position.x + Math.cos(angle) * 300,
      y: anchor.position.y + Math.sin(angle) * 220,
    },
    data: {
      termZh: suggestion.termZh,
      termEn: suggestion.termEn,
      domainZh: suggestion.domainZh,
      domainEn: suggestion.domainEn,
      scopeZh: suggestion.scopeZh,
      scopeEn: suggestion.scopeEn,
      definitionZh: "点亮后将联网验证并生成完整解释。",
      definitionEn: "A full researched explanation will be generated when this node is activated.",
      exampleZh: "建议节点尚未生成正式案例。",
      status: "suggested" satisfies NodeStatus,
      confidence: suggestion.confidence,
      suggestionReason: suggestion.reasonZh,
    },
  };
}

export function integrateGenerationResult(
  document: KnowledgeDocument,
  result: Extract<TermGenerationResult, { kind: "completed" }>,
  targetNodeId?: string,
  newNodeId?: string,
): { document: KnowledgeDocument; selectedId: string; suggestionCount: number } {
  const target = targetNodeId
    ? document.nodes.find((node) => node.id === targetNodeId)
    : undefined;
  const generatedNode: KnowledgeNodeRecord = target
    ? { ...target, data: result.node }
    : {
      id: newNodeId ?? `node-${hashText(`${result.node.termZh}|${result.node.domainZh}|${result.node.scopeZh}`)}`,
      position: { x: 380 + (document.nodes.length % 3) * 75, y: 160 + (document.nodes.length % 4) * 70 },
      data: result.node,
    };

  const baseNodes = target
    ? document.nodes.map((node) => node.id === target.id ? generatedNode : node)
    : [...document.nodes, generatedNode];
  const existingTerms = new Set(baseNodes.flatMap((node) => [
    node.data.termZh.toLocaleLowerCase(),
    node.data.termEn.toLocaleLowerCase(),
  ]));
  const newSuggestions: KnowledgeNodeRecord[] = [];
  const suggestionEdges: KnowledgeEdgeRecord[] = [];

  for (const suggestion of result.suggestions) {
    if (
      existingTerms.has(suggestion.termZh.toLocaleLowerCase())
      || existingTerms.has(suggestion.termEn.toLocaleLowerCase())
    ) continue;

    const node = suggestionNode(suggestion, generatedNode, newSuggestions.length);
    existingTerms.add(suggestion.termZh.toLocaleLowerCase());
    existingTerms.add(suggestion.termEn.toLocaleLowerCase());
    newSuggestions.push(node);
    suggestionEdges.push({
      id: `edge-${hashText(`${generatedNode.id}|${node.id}|${suggestion.relationType}`)}`,
      source: suggestion.direction === "from_new" ? generatedNode.id : node.id,
      target: suggestion.direction === "from_new" ? node.id : generatedNode.id,
      relationType: suggestion.relationType,
      label: relationLabel[suggestion.relationType],
      status: "proposed",
    });
  }

  const existingEdgeKeys = new Set(document.edges.map((edge) => (
    `${edge.source}|${edge.target}|${edge.relationType}`
  )));
  const relationEdges = result.relations.flatMap((relation) => {
    if (relation.targetId === generatedNode.id) return [];
    const source = relation.direction === "from_new" ? generatedNode.id : relation.targetId;
    const targetId = relation.direction === "from_new" ? relation.targetId : generatedNode.id;
    const key = `${source}|${targetId}|${relation.relationType}`;
    if (existingEdgeKeys.has(key)) return [];
    existingEdgeKeys.add(key);
    return [{
      id: `edge-${hashText(key)}`,
      source,
      target: targetId,
      relationType: relation.relationType,
      label: relation.label,
      status: "proposed" as const,
    }];
  });

  return {
    document: {
      ...document,
      nodes: [...baseNodes, ...newSuggestions],
      edges: [...document.edges, ...relationEdges, ...suggestionEdges],
    },
    selectedId: generatedNode.id,
    suggestionCount: newSuggestions.length,
  };
}

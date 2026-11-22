import { z } from "zod";
import {
  knowledgeNodeDataSchema,
  relationTypeSchema,
} from "@/lib/knowledge";

export const existingNodeSummarySchema = z.object({
  id: z.string().min(1).max(200),
  termZh: z.string().min(1).max(200),
  termEn: z.string().min(1).max(200),
  domainZh: z.string().min(1).max(300),
  scopeZh: z.string().min(1).max(500),
  status: z.enum(["confirmed", "suggested", "needs_review"]),
});

export const contextOptionSchema = z.object({
  id: z.string().min(1),
  labelZh: z.string().min(1),
  labelEn: z.string().min(1),
  descriptionZh: z.string().min(1),
});
export type ContextOption = z.infer<typeof contextOptionSchema>;

export const termGenerationRequestSchema = z.object({
  term: z.string().trim().min(1).max(120),
  contextId: z.string().trim().min(1).max(200).nullable().default(null),
  contextLabel: z.string().trim().min(1).max(500).nullable().default(null),
  existingNodes: z.array(existingNodeSummarySchema).max(100).default([]),
});
export type TermGenerationRequest = z.infer<typeof termGenerationRequestSchema>;

export const generatedRelationSchema = z.object({
  targetId: z.string().min(1),
  direction: z.enum(["from_new", "to_new"]),
  relationType: relationTypeSchema,
  label: z.string().min(1),
});
export type GeneratedRelation = z.infer<typeof generatedRelationSchema>;

export const generatedSuggestionSchema = z.object({
  termZh: z.string().min(1),
  termEn: z.string().min(1),
  domainZh: z.string().min(1),
  domainEn: z.string().min(1),
  scopeZh: z.string().min(1),
  scopeEn: z.string().min(1),
  reasonZh: z.string().min(1),
  relationType: relationTypeSchema,
  direction: z.enum(["from_new", "to_new"]),
  confidence: z.number().min(0).max(1),
});
export type GeneratedSuggestion = z.infer<typeof generatedSuggestionSchema>;

const contextRequiredResultSchema = z.object({
  kind: z.literal("context_required"),
  normalizedTerm: z.string().min(1),
  correctionReason: z.string(),
  options: z.array(contextOptionSchema).min(2).max(4),
});

const completedResultSchema = z.object({
  kind: z.literal("completed"),
  normalizedTerm: z.string().min(1),
  correctionReason: z.string(),
  node: knowledgeNodeDataSchema,
  relations: z.array(generatedRelationSchema),
  suggestions: z.array(generatedSuggestionSchema),
  warnings: z.array(z.string()),
});

export const termGenerationResultSchema = z.discriminatedUnion("kind", [
  contextRequiredResultSchema,
  completedResultSchema,
]);
export type TermGenerationResult = z.infer<typeof termGenerationResultSchema>;

export const termGenerationErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

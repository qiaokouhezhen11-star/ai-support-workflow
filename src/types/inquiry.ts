export type InquiryStatus = "OPEN" | "AI_DRAFTED" | "REVIEW_NEEDED" | "COMPLETED";

export type InquiryCategory =
  | "GENERAL"
  | "TROUBLESHOOTING"
  | "BILLING"
  | "FEATURE_REQUEST"
  | "OTHER";

export type InquiryPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ApprovalStatus =
  | "NOT_REQUESTED"
  | "PENDING"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type AiEvaluationResult = "ACCEPTED" | "EDITED" | "REJECTED";

export type InquiryAuditAction =
  | "CREATED"
  | "AI_ANALYZED"
  | "STATUS_UPDATED"
  | "ASSIGNEE_UPDATED"
  | "AI_RESULT_SAVED"
  | "COMMENT_ADDED"
  | "FIELD_UPDATED";

export type InquiryComment = {
  id: string;
  inquiryId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type InquiryAuditLog = {
  id: string;
  inquiryId: string;
  action: InquiryAuditAction;
  actorName: string;
  fieldName: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  comment: string | null;
  createdAt: string;
};

export type SimilarInquiryCandidate = {
  id: string;
  title: string;
  customerName: string;
  status: InquiryStatus;
  priority: InquiryPriority | null;
  category: InquiryCategory | null;
  summary: string | null;
  matchedTags: string[];
  reason: string;
  updatedAt: string;
  score: number;
};

export type KnowledgeSuggestion = {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: "rule" | "history" | "manual";
  confidence: "high" | "medium";
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: InquiryCategory | null;
  priority: InquiryPriority | null;
  tagsText: string | null;
  keywordsText: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ReplyTemplate = {
  id: string;
  title: string;
  description: string;
  body: string;
  category: InquiryCategory | null;
  priority: InquiryPriority | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AiEvaluationLog = {
  id: string;
  inquiryId: string;
  result: AiEvaluationResult;
  memo: string | null;
  evaluatedBy: string;
  createdAt: string;
};

export type UserRole = "ADMIN" | "MANAGER" | "AGENT" | "VIEWER";

export type InquiryAttachment = {
  id: string;
  inquiryId: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
};

export type Inquiry = {
  id: string;
  title: string;
  customerName: string;
  inquiryBody: string;
  assigneeName: string | null;
  category: InquiryCategory | null;
  priority: InquiryPriority | null;
  summary: string | null;
  draftReply: string | null;
  aiReason: string | null;
  status: InquiryStatus;
  approvalStatus: ApprovalStatus;
  approvalRequestedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvalComment: string | null;
  slaDueAt: string | null;
  createdAt: string;
  updatedAt: string;
  auditLogs?: InquiryAuditLog[];
  commentCount?: number;
  tags?: string[];
  similarInquiries?: SimilarInquiryCandidate[];
  knowledgeSuggestions?: KnowledgeSuggestion[];
  knowledgeArticles?: KnowledgeArticle[];
  replyTemplates?: ReplyTemplate[];
  aiEvaluations?: AiEvaluationLog[];
  attachments?: InquiryAttachment[];
};

export type DuplicateCheckInquiry = {
  id: string;
  title: string;
  customerName: string;
  inquiryBody: string;
  category: InquiryCategory | null;
  priority: InquiryPriority | null;
  summary: string | null;
  draftReply: string | null;
  status: InquiryStatus;
  updatedAt: string;
  tags: string[];
};

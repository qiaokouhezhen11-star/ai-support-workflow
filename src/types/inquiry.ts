export type InquiryStatus = "OPEN" | "AI_DRAFTED" | "REVIEW_NEEDED" | "COMPLETED";

export type InquiryCategory =
  | "GENERAL"
  | "TROUBLESHOOTING"
  | "BILLING"
  | "FEATURE_REQUEST"
  | "OTHER";

export type InquiryPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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
};

export type KnowledgeSuggestion = {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: "rule" | "history";
  confidence: "high" | "medium";
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
  createdAt: string;
  updatedAt: string;
  auditLogs?: InquiryAuditLog[];
  commentCount?: number;
  tags?: string[];
  similarInquiries?: SimilarInquiryCandidate[];
  knowledgeSuggestions?: KnowledgeSuggestion[];
};

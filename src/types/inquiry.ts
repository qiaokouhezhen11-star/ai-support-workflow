export type InquiryStatus = "OPEN" | "AI_DRAFTED" | "REVIEW_NEEDED" | "COMPLETED";

export type InquiryCategory =
  | "GENERAL"
  | "TROUBLESHOOTING"
  | "BILLING"
  | "FEATURE_REQUEST"
  | "OTHER";

export type InquiryPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Inquiry = {
  id: string;
  title: string;
  customerName: string;
  inquiryBody: string;
  category: InquiryCategory | null;
  priority: InquiryPriority | null;
  summary: string | null;
  draftReply: string | null;
  aiReason: string | null;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
};
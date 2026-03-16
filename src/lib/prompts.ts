export function buildInquiryAnalysisPrompt(inquiryBody: string) {
    return `
  あなたは優秀なカスタマーサポート支援AIです。
  以下の問い合わせ文を分析して、必ずJSON形式だけで返してください。
  Markdownや説明文は不要です。
  
  カテゴリは以下のいずれかにしてください：
  GENERAL / TROUBLESHOOTING / BILLING / FEATURE_REQUEST / OTHER
  
  優先度は以下のいずれかにしてください：
  LOW / MEDIUM / HIGH / URGENT
  
  返すJSONの形は必ずこれです：
  {
    "category": "GENERAL",
    "priority": "LOW",
    "summary": "問い合わせ内容の短い要約",
    "draftReply": "担当者がたたき台として使える丁寧な回答案",
    "aiReason": "そのカテゴリと優先度にした理由"
  }
  
  問い合わせ文:
  ${inquiryBody}
    `.trim();
  }
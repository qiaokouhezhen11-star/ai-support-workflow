import type {
  Inquiry,
  KnowledgeSuggestion,
  SimilarInquiryCandidate,
} from "@/types/inquiry";
import {
  getCategoryLabel,
  getPriorityLabel,
  getStatusLabel,
} from "@/lib/inquiryLabels";

type InquiryLike = {
  id: string;
  title: string;
  customerName: string;
  inquiryBody: string;
  category: Inquiry["category"];
  priority: Inquiry["priority"];
  summary: string | null;
  draftReply: string | null;
  status: Inquiry["status"];
  updatedAt: Date | string;
  tags: Array<{ name: string }> | string[];
};

function normalizeTags(tags: InquiryLike["tags"]) {
  return tags.map((tag) => (typeof tag === "string" ? tag : tag.name));
}

function tokenize(text: string) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)
    )
  );
}

function sharedKeywords(a: string, b: string) {
  const aTokens = tokenize(a);
  const bTokenSet = new Set(tokenize(b));

  return aTokens.filter((token) => bTokenSet.has(token));
}

export function buildSimilarInquiryCandidates(
  inquiry: InquiryLike,
  candidates: InquiryLike[]
): SimilarInquiryCandidate[] {
  const currentTags = normalizeTags(inquiry.tags);
  const currentTitleAndBody = `${inquiry.title} ${inquiry.inquiryBody} ${inquiry.summary ?? ""}`;

  return candidates
    .map((candidate) => {
      const candidateTags = normalizeTags(candidate.tags);
      const matchedTags = candidateTags.filter((tag) => currentTags.includes(tag));
      const keywordMatches = sharedKeywords(
        currentTitleAndBody,
        `${candidate.title} ${candidate.inquiryBody} ${candidate.summary ?? ""}`
      );
      const reasons: string[] = [];
      let score = 0;

      if (inquiry.category && inquiry.category === candidate.category) {
        score += 4;
        reasons.push(`カテゴリが同じ (${getCategoryLabel(candidate.category)})`);
      }

      if (inquiry.priority && inquiry.priority === candidate.priority) {
        score += 2;
        reasons.push(`優先度が近い (${getPriorityLabel(candidate.priority)})`);
      }

      if (matchedTags.length > 0) {
        score += Math.min(matchedTags.length * 2, 4);
        reasons.push(`共通タグ: ${matchedTags.join(", ")}`);
      }

      if (keywordMatches.length > 0) {
        score += Math.min(keywordMatches.length, 4);
        reasons.push(`本文キーワード一致: ${keywordMatches.slice(0, 3).join(", ")}`);
      }

      if (candidate.summary) {
        score += 1;
      }

      if (candidate.status === "COMPLETED" || candidate.status === "REVIEW_NEEDED") {
        score += 1;
      }

      const updatedAtTime =
        typeof candidate.updatedAt === "string"
          ? new Date(candidate.updatedAt).getTime()
          : candidate.updatedAt.getTime();

      return {
        id: candidate.id,
        title: candidate.title,
        customerName: candidate.customerName,
        status: candidate.status,
        priority: candidate.priority,
        category: candidate.category,
        summary: candidate.summary,
        matchedTags,
        reason:
          reasons.join(" / ") ||
          "本文や属性に近い要素があるため、参考候補として表示しています。",
        updatedAt:
          typeof candidate.updatedAt === "string"
            ? candidate.updatedAt
            : candidate.updatedAt.toISOString(),
        score,
        updatedAtTime,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.updatedAtTime - a.updatedAtTime;
    })
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.title,
      customerName: item.customerName,
      status: item.status,
      priority: item.priority,
      category: item.category,
      summary: item.summary,
      matchedTags: item.matchedTags,
      reason: item.reason,
      updatedAt: item.updatedAt,
    }));
}

export function buildKnowledgeSuggestions(inquiry: InquiryLike): KnowledgeSuggestion[] {
  const tags = normalizeTags(inquiry.tags);
  const suggestions: KnowledgeSuggestion[] = [];

  if (inquiry.category === "TROUBLESHOOTING") {
    suggestions.push({
      id: "troubleshooting-checklist",
      title: "不具合の一次切り分けチェック",
      summary: "再現条件、発生端末、直前操作を先に確認すると調査しやすくなります。",
      content:
        "OS、ブラウザ、発生時刻、再現手順、エラーメッセージの有無を整理してから開発側へ引き継ぐと、対応速度を上げやすいです。",
      source: "rule",
      confidence: "high",
    });
  }

  if (inquiry.category === "BILLING") {
    suggestions.push({
      id: "billing-confirmation",
      title: "請求確認の基本フロー",
      summary: "請求番号、対象月、契約内容、決済ログの4点を揃えると確認漏れを減らせます。",
      content:
        "二重請求や金額相違では、対象請求月、契約プラン、請求明細、決済代行の結果を照合してから一次回答すると説明しやすいです。",
      source: "rule",
      confidence: "high",
    });
  }

  if (inquiry.category === "FEATURE_REQUEST") {
    suggestions.push({
      id: "feature-request-template",
      title: "要望整理の観点",
      summary: "利用シーン、困りごと、代替手段の有無を押さえると優先度判断がしやすくなります。",
      content:
        "誰が、いつ、どの画面で困っているかを確認すると、単なる要望か緊急改善かを見分けやすくなります。",
      source: "rule",
      confidence: "medium",
    });
  }

  if (inquiry.priority === "URGENT") {
    suggestions.push({
      id: "urgent-response",
      title: "緊急案件の一次回答方針",
      summary: "現状把握中であること、次回連絡予定、影響範囲確認を早めに返すと安心感が出ます。",
      content:
        "緊急度が高い案件では、原因確定前でも受付完了、調査開始、次回報告予定時刻を伝えると不安を減らしやすいです。",
      source: "rule",
      confidence: "high",
    });
  }

  if (tags.includes("ログイン")) {
    suggestions.push({
      id: "login-knowledge",
      title: "ログイン系の確認ポイント",
      summary: "アカウント状態、権限、ブラウザキャッシュ、SSO連携状況を先に確認します。",
      content:
        "ログイン不具合では、ユーザー権限やセッション切れ、ブラウザ拡張機能、認証基盤の障害を切り分けると原因特定が早まります。",
      source: "rule",
      confidence: "medium",
    });
  }

  if (inquiry.draftReply) {
    suggestions.push({
      id: "existing-draft",
      title: "現在の回答案をベースに調整",
      summary: "AIが作成した回答案をベースに、事実確認済みの内容だけ残す運用がおすすめです。",
      content:
        "詳細画面の回答案はそのまま送らず、確定している情報、次回連絡予定、担当者名に合わせて整えてから送信候補にすると安全です。",
      source: "history",
      confidence: "medium",
    });
  }

  return suggestions.slice(0, 4);
}

export function buildHistoryKnowledgeCandidates(
  candidates: SimilarInquiryCandidate[]
): KnowledgeSuggestion[] {
  return candidates
    .filter((item) => item.summary)
    .slice(0, 2)
    .map((item) => ({
      id: `history-${item.id}`,
      title: `${item.title} から学べる対応メモ`,
      summary: `${getStatusLabel(item.status)} / ${item.customerName} の類似案件です。`,
      content:
        item.summary ??
        "類似案件の要約を参考に、初回ヒアリング項目や一次回答の言い回しを揃えられます。",
      source: "history",
      confidence: "medium",
    }));
}

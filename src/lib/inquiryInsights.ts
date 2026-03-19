import type {
  Inquiry,
  KnowledgeArticle,
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

const JP_STOP_WORDS = new Set([
  "です",
  "ます",
  "した",
  "して",
  "する",
  "され",
  "ため",
  "よう",
  "こと",
  "確認",
  "お願い",
  "ください",
  "おります",
  "なり",
  "ある",
  "いる",
  "対応",
  "利用",
  "画面",
  "管理",
  "内容",
  "機能",
  "表示",
  "状態",
]);

function normalizeTags(tags: InquiryLike["tags"]) {
  return tags.map((tag) => (typeof tag === "string" ? tag : tag.name));
}

function normalizeListText(text: string | null | undefined) {
  if (!text) {
    return [];
  }

  return Array.from(
    new Set(
      text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function tokenizeSegment(segment: string) {
  const normalized = segment.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  if (/^[a-z0-9]+$/i.test(normalized)) {
    return normalized.length >= 2 ? [normalized] : [];
  }

  const compact = normalized.replace(/\s+/g, "");

  if (compact.length < 2) {
    return [];
  }

  const tokens: string[] = [];

  for (let index = 0; index < compact.length - 1; index += 1) {
    tokens.push(compact.slice(index, index + 2));
  }

  if (compact.length >= 3) {
    for (let index = 0; index < compact.length - 2; index += 1) {
      tokens.push(compact.slice(index, index + 3));
    }
  }

  return tokens;
}

function tokenize(text: string) {
  const segments = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .flatMap((segment) => segment.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+|[a-z0-9]+/giu) ?? []);

  return Array.from(
    new Set(
      segments
        .flatMap((segment) => tokenizeSegment(segment))
        .map((item) => item.trim())
        .filter((item) => item.length >= 2 && !JP_STOP_WORDS.has(item))
    )
  );
}

function buildWeightedTokenMap(fields: Array<{ text: string | null | undefined; weight: number }>) {
  const tokenMap = new Map<string, number>();

  for (const field of fields) {
    const tokens = tokenize(field.text ?? "");

    for (const token of tokens) {
      tokenMap.set(token, Math.max(tokenMap.get(token) ?? 0, field.weight));
    }
  }

  return tokenMap;
}

function sumTokenOverlapScore(current: Map<string, number>, candidate: Map<string, number>) {
  const shared = Array.from(current.keys())
    .filter((token) => candidate.has(token))
    .map((token) => ({
      token,
      weight: (current.get(token) ?? 0) + (candidate.get(token) ?? 0),
    }))
    .sort((a, b) => b.weight - a.weight);

  const score = Math.min(
    25,
    shared.slice(0, 5).reduce((total, item) => total + Math.min(6, item.weight), 0)
  );

  return {
    score,
    keywords: shared.slice(0, 3).map((item) => item.token),
  };
}

function getUpdatedAtTime(value: Date | string) {
  return typeof value === "string" ? new Date(value).getTime() : value.getTime();
}

function getFreshnessScore(updatedAtTime: number) {
  const now = Date.now();
  const days = Math.max(0, (now - updatedAtTime) / (1000 * 60 * 60 * 24));

  if (days <= 3) {
    return 5;
  }

  if (days <= 14) {
    return 3;
  }

  return 1;
}

export function buildSimilarInquiryCandidates(
  inquiry: InquiryLike,
  candidates: InquiryLike[]
): SimilarInquiryCandidate[] {
  const currentTags = normalizeTags(inquiry.tags);
  const currentTokenMap = buildWeightedTokenMap([
    { text: inquiry.title, weight: 5 },
    { text: inquiry.inquiryBody, weight: 4 },
    { text: inquiry.summary, weight: 3 },
    { text: inquiry.draftReply, weight: 2 },
    { text: currentTags.join(" "), weight: 6 },
  ]);

  return candidates
    .map((candidate) => {
      const candidateTags = normalizeTags(candidate.tags);
      const matchedTags = candidateTags.filter((tag) => currentTags.includes(tag));
      const candidateTokenMap = buildWeightedTokenMap([
        { text: candidate.title, weight: 5 },
        { text: candidate.inquiryBody, weight: 4 },
        { text: candidate.summary, weight: 3 },
        { text: candidate.draftReply, weight: 2 },
        { text: candidateTags.join(" "), weight: 6 },
      ]);

      const keywordMatch = sumTokenOverlapScore(currentTokenMap, candidateTokenMap);
      const reasons: string[] = [];
      let score = 0;

      if (inquiry.category && inquiry.category === candidate.category) {
        score += 30;
        reasons.push(`カテゴリ一致: ${getCategoryLabel(candidate.category)}`);
      }

      if (inquiry.priority && inquiry.priority === candidate.priority) {
        score += 10;
        reasons.push(`優先度一致: ${getPriorityLabel(candidate.priority)}`);
      }

      if (matchedTags.length > 0) {
        score += Math.min(20, matchedTags.length * 7);
        reasons.push(`共通タグ: ${matchedTags.join(", ")}`);
      }

      if (keywordMatch.keywords.length > 0) {
        score += keywordMatch.score;
        reasons.push(`本文の近い語句: ${keywordMatch.keywords.join(", ")}`);
      }

      if (candidate.summary) {
        score += 3;
      }

      if (candidate.draftReply) {
        score += 2;
      }

      if (candidate.status === "COMPLETED" || candidate.status === "REVIEW_NEEDED") {
        score += 5;
      }

      const updatedAtTime = getUpdatedAtTime(candidate.updatedAt);
      score += getFreshnessScore(updatedAtTime);

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
        score: Math.min(100, score),
        updatedAtTime,
      };
    })
    .filter((item) => item.score >= 20)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.updatedAtTime - a.updatedAtTime;
    })
    .slice(0, 4)
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
      score: item.score,
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

export function buildManualKnowledgeSuggestions(
  inquiry: InquiryLike,
  articles: KnowledgeArticle[]
): KnowledgeSuggestion[] {
  const inquiryTags = normalizeTags(inquiry.tags);
  const inquiryTokenMap = buildWeightedTokenMap([
    { text: inquiry.title, weight: 5 },
    { text: inquiry.inquiryBody, weight: 4 },
    { text: inquiry.summary, weight: 3 },
    { text: inquiry.draftReply, weight: 2 },
    { text: inquiryTags.join(" "), weight: 6 },
  ]);

  return articles
    .map((article) => {
      const articleTags = normalizeListText(article.tagsText);
      const matchedTags = articleTags.filter((tag) => inquiryTags.includes(tag));
      const articleTokenMap = buildWeightedTokenMap([
        { text: article.title, weight: 5 },
        { text: article.summary, weight: 4 },
        { text: article.content, weight: 3 },
        { text: article.tagsText, weight: 6 },
        { text: article.keywordsText, weight: 5 },
      ]);
      const keywordMatch = sumTokenOverlapScore(inquiryTokenMap, articleTokenMap);

      let score = 0;

      if (article.category && article.category === inquiry.category) {
        score += 30;
      }

      if (article.priority && article.priority === inquiry.priority) {
        score += 10;
      }

      if (matchedTags.length > 0) {
        score += Math.min(20, matchedTags.length * 7);
      }

      score += keywordMatch.score;

      return {
        article,
        score: Math.min(100, score),
      };
    })
    .filter((item) => item.score >= 20)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return new Date(b.article.updatedAt).getTime() - new Date(a.article.updatedAt).getTime();
    })
    .slice(0, 3)
    .map(({ article, score }) => ({
      id: `manual-${article.id}`,
      title: article.title,
      summary: article.summary,
      content: article.content,
      source: "manual" as const,
      confidence: score >= 60 ? "high" : "medium",
    }));
}

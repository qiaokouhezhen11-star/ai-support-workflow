import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.inquiryTag.deleteMany();
  await prisma.inquiryAuditLog.deleteMany();
  await prisma.inquiryComment.deleteMany();
  await prisma.inquiry.deleteMany();

  const inquiry1 = await prisma.inquiry.create({
    data: {
      id: "sample-billing-001",
      title: "請求金額が二重に引き落とされている",
      customerName: "山田 花子",
      inquiryBody:
        "先月分の利用料金について、クレジットカード明細を確認したところ同じ金額が二重で引き落とされていました。至急確認をお願いします。",
      category: "BILLING",
      priority: "HIGH",
      summary:
        "請求金額が二重で決済されている可能性があり、早急な確認が必要な問い合わせ。",
      draftReply:
        "お問い合わせありがとうございます。ご請求内容を確認のうえ、二重請求の有無を至急調査いたします。確認でき次第、改めてご連絡いたします。",
      aiReason:
        "請求・支払いに関する内容であり、金銭に関わるため優先度は高と判断。",
      status: "REVIEW_NEEDED",
      assigneeName: "佐藤",
    },
  });

  const inquiry2 = await prisma.inquiry.create({
    data: {
      id: "sample-trouble-001",
      title: "ログイン後に画面が真っ白になる",
      customerName: "鈴木 一郎",
      inquiryBody:
        "PC版でログインしたあと、ダッシュボード画面が表示されず真っ白な状態になります。別のブラウザでも試しましたが同じでした。",
      category: "TROUBLESHOOTING",
      priority: "URGENT",
      summary:
        "ログイン後に画面が表示されない不具合。複数ブラウザで再現しており、緊急度が高い。",
      draftReply:
        "お問い合わせありがとうございます。ログイン後の表示不具合について、現在状況を確認しております。ご不便をおかけし申し訳ありません。確認が取れ次第、対応状況をご案内します。",
      aiReason:
        "サービス利用自体に影響する不具合であり、複数ブラウザで再現しているため緊急度は高いと判断。",
      status: "AI_DRAFTED",
      assigneeName: "開発担当",
    },
  });

  const inquiry3 = await prisma.inquiry.create({
    data: {
      id: "sample-feature-001",
      title: "CSV出力機能を追加してほしい",
      customerName: "株式会社サンプル",
      inquiryBody:
        "管理画面で一覧データをCSV出力できるようにしてほしいです。月次レポート作成時に毎回手入力しており、工数がかかっています。",
      status: "OPEN",
    },
  });

  await prisma.inquiryComment.createMany({
    data: [
      {
        inquiryId: inquiry1.id,
        authorName: "佐藤",
        body: "請求ログ確認待ち。返金対応の可能性あり。",
      },
      {
        inquiryId: inquiry1.id,
        authorName: "高橋",
        body: "カード決済代行会社への照会が必要そう。今日中に一次回答予定。",
      },
      {
        inquiryId: inquiry2.id,
        authorName: "開発担当",
        body: "フロント側の表示崩れではなく、APIレスポンス異常の可能性を調査中。",
      },
    ],
  });

  await prisma.inquiryTag.createMany({
    data: [
      { inquiryId: inquiry1.id, name: "請求" },
      { inquiryId: inquiry1.id, name: "返金確認" },
      { inquiryId: inquiry1.id, name: "高優先" },
      { inquiryId: inquiry2.id, name: "障害" },
      { inquiryId: inquiry2.id, name: "ログイン" },
      { inquiryId: inquiry2.id, name: "緊急" },
      { inquiryId: inquiry3.id, name: "機能要望" },
      { inquiryId: inquiry3.id, name: "CSV" },
    ],
  });

  await prisma.inquiryAuditLog.createMany({
    data: [
      {
        inquiryId: inquiry1.id,
        action: "CREATED",
        actorName: "システム",
        comment: "問い合わせが登録されました。",
      },
      {
        inquiryId: inquiry1.id,
        action: "ASSIGNEE_UPDATED",
        actorName: "システム",
        fieldName: "assigneeName",
        beforeValue: null,
        afterValue: "佐藤",
        comment: "初期担当者を設定しました。",
      },
      {
        inquiryId: inquiry1.id,
        action: "AI_RESULT_SAVED",
        actorName: "システム",
        comment: "AI解析結果を保存済みのサンプルです。",
      },
      {
        inquiryId: inquiry1.id,
        action: "STATUS_UPDATED",
        actorName: "佐藤",
        fieldName: "status",
        beforeValue: "OPEN",
        afterValue: "REVIEW_NEEDED",
        comment: "担当者確認待ちに変更しました。",
      },
      {
        inquiryId: inquiry2.id,
        action: "CREATED",
        actorName: "システム",
        comment: "問い合わせが登録されました。",
      },
      {
        inquiryId: inquiry2.id,
        action: "ASSIGNEE_UPDATED",
        actorName: "システム",
        fieldName: "assigneeName",
        beforeValue: null,
        afterValue: "開発担当",
        comment: "初期担当者を設定しました。",
      },
      {
        inquiryId: inquiry2.id,
        action: "AI_ANALYZED",
        actorName: "システム",
        comment: "AI解析を実行して候補を生成しました。",
      },
      {
        inquiryId: inquiry3.id,
        action: "CREATED",
        actorName: "システム",
        comment: "問い合わせが登録されました。",
      },
    ],
  });

  console.log("Seed completed.");
  console.log("Created inquiries:", {
    inquiry1: inquiry1.id,
    inquiry2: inquiry2.id,
    inquiry3: inquiry3.id,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

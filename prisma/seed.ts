import "dotenv/config";
import { prisma } from "../src/lib/prisma";

function addHours(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

async function main() {
  await prisma.replyTemplate.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
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
      slaDueAt: addHours(-6),
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
      slaDueAt: addHours(-1),
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

  const inquiry4 = await prisma.inquiry.create({
    data: {
      id: "sample-billing-002",
      title: "請求書の金額と管理画面の表示が一致しない",
      customerName: "田中 美咲",
      inquiryBody:
        "今月の請求書に記載されている金額と、管理画面の利用明細に表示される合計金額が一致していません。差額の理由を確認したいです。",
      category: "BILLING",
      priority: "HIGH",
      summary:
        "請求書と管理画面の金額差異に関する問い合わせ。請求明細と調整項目の確認が必要。",
      draftReply:
        "お問い合わせありがとうございます。請求書と管理画面の表示差異について、対象月の請求明細と調整内容を確認のうえご案内いたします。",
      aiReason: "請求内容の不一致に関する問い合わせであり、金額確認が必要なため優先度は高と判断。",
      status: "REVIEW_NEEDED",
      assigneeName: "佐藤",
      slaDueAt: addHours(3),
    },
  });

  const inquiry5 = await prisma.inquiry.create({
    data: {
      id: "sample-trouble-002",
      title: "SSOログイン後にダッシュボードだけ表示されない",
      customerName: "高橋 次郎",
      inquiryBody:
        "SSOでログインするとトップ画面までは見えますが、ダッシュボードへ移動した瞬間に画面が真っ白になります。社内の複数ユーザーで再現しています。",
      category: "TROUBLESHOOTING",
      priority: "URGENT",
      summary:
        "SSOログイン後の画面表示不具合。複数ユーザーで再現しており、認証連携または画面初期表示の異常が疑われる。",
      draftReply:
        "お問い合わせありがとうございます。SSOログイン後の表示不具合について、再現状況と認証連携の状態を確認しております。進捗があり次第、優先してご案内いたします。",
      aiReason:
        "ログイン後の主要画面が利用できず複数ユーザーへ影響しているため、緊急度は高いと判断。",
      status: "AI_DRAFTED",
      assigneeName: "開発担当",
      slaDueAt: addHours(1),
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
      {
        inquiryId: inquiry4.id,
        authorName: "佐藤",
        body: "調整額の計上タイミングを経理チームに確認中。",
      },
      {
        inquiryId: inquiry5.id,
        authorName: "開発担当",
        body: "SSO連携時の権限取得ログを確認。ダッシュボード初期APIの403疑いあり。",
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
      { inquiryId: inquiry4.id, name: "請求" },
      { inquiryId: inquiry4.id, name: "請求明細" },
      { inquiryId: inquiry4.id, name: "金額差異" },
      { inquiryId: inquiry5.id, name: "障害" },
      { inquiryId: inquiry5.id, name: "ログイン" },
      { inquiryId: inquiry5.id, name: "SSO" },
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
      {
        inquiryId: inquiry4.id,
        action: "CREATED",
        actorName: "システム",
        comment: "問い合わせが登録されました。",
      },
      {
        inquiryId: inquiry4.id,
        action: "AI_RESULT_SAVED",
        actorName: "システム",
        comment: "AI解析結果を保存済みのサンプルです。",
      },
      {
        inquiryId: inquiry5.id,
        action: "CREATED",
        actorName: "システム",
        comment: "問い合わせが登録されました。",
      },
      {
        inquiryId: inquiry5.id,
        action: "AI_ANALYZED",
        actorName: "システム",
        comment: "AI解析を実行して候補を生成しました。",
      },
    ],
  });

  await prisma.knowledgeArticle.createMany({
    data: [
      {
        title: "請求差異の一次確認テンプレート",
        summary: "請求書と管理画面の金額がずれるときに確認する基本項目です。",
        content:
          "対象月、契約プラン、割引・返金・調整額、決済代行の処理結果を順番に確認します。一次回答では、差額要因を確認中であることと次回連絡予定を先に伝えると安心感が出ます。",
        category: "BILLING",
        priority: "HIGH",
        tagsText: "請求, 返金確認, 請求明細",
        keywordsText: "二重請求, 差額, 決済ログ, 明細",
        createdBy: "山田",
      },
      {
        title: "SSOログイン障害の切り分けメモ",
        summary: "SSOログイン後に表示が崩れるときの確認観点をまとめたナレッジです。",
        content:
          "認証基盤の応答、トークン期限、権限マッピング、初期表示APIのステータス、ブラウザコンソールのエラーを確認します。複数ユーザーで再現する場合は障害告知の判断も早めに行います。",
        category: "TROUBLESHOOTING",
        priority: "URGENT",
        tagsText: "ログイン, 障害, SSO",
        keywordsText: "真っ白, ダッシュボード, 権限, 403",
        createdBy: "開発担当",
      },
      {
        title: "機能要望ヒアリング項目",
        summary: "機能追加の相談を受けたときに抜けやすい確認項目です。",
        content:
          "誰が使うか、頻度、現状の代替手段、CSV出力が必要な列、出力タイミング、既存ワークフローへの影響を確認すると、優先度判断と要件整理がしやすくなります。",
        category: "FEATURE_REQUEST",
        tagsText: "機能要望, CSV",
        keywordsText: "レポート, 出力, 要件整理",
        createdBy: "PM",
      },
    ],
  });

  await prisma.replyTemplate.createMany({
    data: [
      {
        title: "請求確認中の一次返信",
        description: "請求差異や二重請求の確認を始めたことを伝える定型文です。",
        body:
          "お問い合わせありがとうございます。ご請求内容について確認を開始しております。対象月の請求明細と決済履歴を確認のうえ、判明次第あらためてご案内いたします。",
        category: "BILLING",
        priority: "HIGH",
        createdBy: "佐藤",
      },
      {
        title: "障害調査中の一次返信",
        description: "ログイン障害や画面表示不具合で、調査中であることを伝える定型文です。",
        body:
          "お問い合わせありがとうございます。現在、事象の再現確認と原因調査を進めております。ご不便をおかけして申し訳ありません。進捗があり次第、優先してご連絡いたします。",
        category: "TROUBLESHOOTING",
        priority: "URGENT",
        createdBy: "開発担当",
      },
      {
        title: "機能要望の受付返信",
        description: "機能要望を受け付け、社内検討へ回すときの定型文です。",
        body:
          "ご要望をお寄せいただきありがとうございます。いただいた内容は社内で検討し、今後の改善候補として共有いたします。進展がありましたら、あらためてご案内いたします。",
        category: "FEATURE_REQUEST",
        priority: "MEDIUM",
        createdBy: "担当者",
      },
    ],
  });

  console.log("Seed completed.");
  console.log("Created inquiries:", {
    inquiry1: inquiry1.id,
    inquiry2: inquiry2.id,
    inquiry3: inquiry3.id,
    inquiry4: inquiry4.id,
    inquiry5: inquiry5.id,
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

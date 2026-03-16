import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.inquiry.deleteMany();

  await prisma.inquiry.createMany({
    data: [
      {
        title: "装置画面がフリーズして操作できない",
        customerName: "テスト病院",
        inquiryBody:
          "装置の電源は入りますが、起動後に画面が固まり、操作を受け付けません。本日中に使用したいため、できるだけ早く復旧方法を知りたいです。",
        status: "OPEN",
      },
      {
        title: "請求書の金額が想定と異なる",
        customerName: "サンプルクリニック",
        inquiryBody:
          "今月の請求書を確認したところ、契約時の説明より高い金額が記載されていました。内訳を確認したいです。",
        status: "OPEN",
      },
      {
        title: "新機能の追加要望",
        customerName: "メディカルセンターA",
        inquiryBody:
          "検査結果のCSV出力時に、患者IDだけでなく部門名も含めて出力できるようにしてほしいです。",
        status: "OPEN",
      },
      {
        title: "交換部品の納期確認",
        customerName: "中央総合病院",
        inquiryBody:
          "先日依頼した交換部品について、現在の納期見込みを教えてください。来週中に必要です。",
        status: "AI_DRAFTED",
        category: "GENERAL",
        priority: "MEDIUM",
        summary: "交換部品の納期確認依頼",
        draftReply:
          "お問い合わせありがとうございます。交換部品の納期について、現在の手配状況を確認のうえ、改めてご連絡いたします。",
        aiReason:
          "一般的な納期確認であり、障害や請求ではないためGENERALと判断しました。",
      },
      {
        title: "問い合わせ対応完了の確認",
        customerName: "テスト医療センター",
        inquiryBody:
          "先日問い合わせた印刷不具合について、その後正常に動作しています。対応ありがとうございました。",
        status: "COMPLETED",
        category: "GENERAL",
        priority: "LOW",
        summary: "以前の不具合問い合わせへのお礼と完了報告",
        draftReply:
          "ご連絡ありがとうございます。正常に動作しているとのことで安心しました。今後も何かありましたらご連絡ください。",
        aiReason: "障害は解消済みで緊急性が低いためLOWと判断しました。",
      },
    ],
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
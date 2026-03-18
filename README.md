<<<<<<< HEAD
# AI問い合わせ対応支援アプリ

問い合わせの登録・一覧管理・AIによる分類 / 優先度判定 / 要約 / 回答案生成・人間による確認保存までを行う、**業務利用を意識した生成AIアプリ**です。

転職用ポートフォリオとして、単なるチャットUIではなく、**生成AIを業務フローに組み込む実装力** を示すことを目的に開発しました。

---

## URL / デモ

※ デプロイ後に追記予定

- Demo: `準備中`
- Repository: `準備中`

---

## 背景

生成AIアプリというと、ChatGPTのようなチャットUIを作る例が多いですが、実務ではそれだけでなく、

- 問い合わせの一次整理
- 優先度の判定
- 回答案の作成
- 人間による確認・修正
- ステータス管理
- 再確認・再編集

のように、**既存業務フローの一部としてAIを組み込む設計** が重要だと考えています。

そこで本アプリでは、問い合わせ対応業務を題材に、  
**「AIが下書きを作り、人が確認して運用する」** という、実務導入を意識した形でアプリを設計・実装しました。

---

## このアプリで解決したい課題

問い合わせ対応では、担当者が毎回以下を手作業で行うことがあります。

- 問い合わせ内容の把握
- 種類ごとの分類
- 緊急度の判断
- 回答文のたたき台作成
- 対応状況の管理

これらをすべて人手で行うと、対応のばらつきや初動の遅れが起きやすくなります。

本アプリでは、AIを使って以下を支援します。

- 問い合わせのカテゴリ分類
- 優先度判定
- 要約生成
- 回答案の生成
- 判定理由の生成

ただし、AIの出力をそのまま自動送信するのではなく、  
**人間が確認・編集して保存できる運用** にしている点を重視しています。

---

## 主な機能

### 1. 問い合わせ管理
- 問い合わせの新規登録
- 問い合わせ一覧表示
- 問い合わせ詳細表示

### 2. AI解析
- カテゴリ分類
- 優先度判定
- 要約生成
- 回答案生成
- 判定理由生成

### 3. 人間確認フロー
- AI解析結果の確認
- 要約 / 回答案 / 判定理由の手動編集
- 編集後の保存
- ステータス更新

### 4. 一覧画面の業務向け機能
- キーワード検索
- ステータス絞り込み
- 優先度絞り込み
- 集計カード表示
- 優先度色分け表示

### 5. 更新履歴（監査ログ風）
- 問い合わせ作成時の履歴保存
- AI解析実行時の履歴保存
- AI結果保存時の履歴保存
- ステータス更新時の履歴保存
- 詳細画面で履歴一覧を確認可能

---

## 画面イメージ

※ スクリーンショットを追加予定

- ホーム画面
- 問い合わせ一覧画面
- 新規登録画面
- 詳細画面
- AI解析結果表示画面

---

## 技術スタック

### フロントエンド
- Next.js 16 (App Router)
- React
- TypeScript
- Tailwind CSS

### バックエンド
- Next.js Route Handlers
- TypeScript

### AI
- OpenAI API
- Structured Output を用いた構造化レスポンス利用

### データベース
- Prisma
- SQLite

### バリデーション
- Zod

---

## システム構成

```txt
ユーザー
  ↓
Next.js フロントエンド
  ↓
Route Handler(API)
  ├─ Prisma 経由で SQLite に保存
  └─ OpenAI API で問い合わせ本文を解析
         ↓
   分類 / 優先度 / 要約 / 回答案 / 判定理由を生成
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 6fe66b7 (Initial commit from Create Next App)

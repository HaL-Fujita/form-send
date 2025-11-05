# 📧 営業メール一括送信ツール (FUJI)

Claude AIで自動生成したHTMLメールを、顧客データベースから一括送信できる営業効率化ツールです。

## ✨ 主な機能

### 👥 顧客管理（150万件対応）
- ✅ **顧客データベース** - Prisma + SQLiteで大規模データを管理
- ✅ **CSVインポート** - ドラッグ&ドロップで簡単アップロード
- ✅ **業界・業種別フィルタリング** - ターゲットを絞った送信
- ✅ **顧客の個別編集・削除** - データの修正・削除が可能
- ✅ **検索機能** - 名前、メール、会社名で検索

### 🎯 一括送信機能
- ✅ **CSVアップロード** - 顧客リスト（名前、メール、会社名、役職）を一括読み込み
- ✅ **差し込み機能** - `{name}`, `{company}`, `{position}` を自動置換
- ✅ **一括送信** - 数十〜数百件の顧客に自動送信
- ✅ **送信結果表示** - 成功/失敗件数、エラー詳細を表示
- ✅ **送信履歴** - 過去の送信記録を保存・確認
- ✅ **履歴から再送信** - 過去の宛先リストを再利用

### 🤖 AI機能（Claude Sonnet 4）
- ✅ **メール本文自動生成** - 簡単な指示からClaude AIが完全なメール本文を作成
- ✅ **HTMLメール自動生成** - テキストを美しいHTMLメールに変換
- ✅ **ブランド設定** - 企業カラー・フォントでカスタマイズ

### 📱 プレビュー
- ✅ **リアルタイムプレビュー** - PC/Mobile表示切替
- ✅ **インラインCSS** - メールクライアントで崩れにくい

---

## 🚀 セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. データベースのセットアップ

Prismaのマイグレーションを実行：

```bash
npx prisma migrate dev --name init
```

これにより、SQLiteデータベースが作成され、顧客データを管理できるようになります。

### 3. 環境変数の設定

`.env.local` ファイルを編集：

```bash
# Claude Sonnet API設定（必須）
ANTHROPIC_API_KEY=your_actual_api_key_here

# メール送信設定（必須）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# データベース設定（デフォルトのまま使用可能）
DATABASE_URL="file:./prisma/dev.db"
```

#### Anthropic APIキーの取得:
1. [Anthropic Console](https://console.anthropic.com/) でアカウント作成
2. API Keys セクションで新しいキーを作成
3. `ANTHROPIC_API_KEY` に設定

#### Gmail SMTP設定:
1. Gmailで「2段階認証」を有効化
2. [アプリパスワード](https://myaccount.google.com/apppasswords)を生成（16桁）
3. `SMTP_USER` に自分のGmailアドレス
4. `SMTP_PASS` にアプリパスワード

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

---

## 📖 使い方

### 3つの主要ページ

1. **📧 メール送信ページ** (`/`)
   - メールの作成・プレビュー・送信

2. **👥 顧客管理ページ** (`/customers`)
   - 顧客データベースの管理（インポート、編集、削除、フィルタリング）

3. **📊 送信履歴ページ** (`/history`)
   - 過去の送信記録の確認・再送信

### 基本的なワークフロー

#### パターン1: 顧客管理から送信

1. **顧客データをインポート**
   - 「👥 顧客管理」ページへ移動
   - CSVファイルをドラッグ&ドロップ（または選択）
   - フォーマット: `name,email,company,position,industry,sector`

2. **顧客を選択**
   - 業界・業種でフィルタリング
   - 検索機能で絞り込み
   - チェックボックスで送信先を選択
   - 「選択したX件にメール送信」ボタンをクリック

3. **メール作成**
   - 自動的にメール送信ページに遷移
   - **方法A**: AI自動生成 → 簡単な指示を入力 → 「メール本文を自動生成」
   - **方法B**: 手動入力 → 本文欄に直接入力

4. **差し込み変数を使う**
   ```
   {name} 様

   {company}の{position}としてご活躍と伺っております。
   ```
   → 「田中太郎 様 株式会社サンプルの営業部長として...」に自動変換

5. **一括送信**
   - 「📨 XX件に一括送信」ボタンをクリック
   - 進捗と結果を確認

#### パターン2: 送信履歴から再送信

1. **送信履歴ページへ**
   - 「📊 送信履歴」ページへ移動
   - 過去の送信記録を確認

2. **再送信したい履歴を選択**
   - 詳細を表示
   - 「この宛先に再度メール送信」ボタンをクリック

3. **新しいメールを作成**
   - 自動的にメール送信ページに遷移
   - 同じ宛先リストで新しいメールを作成・送信

---

## 📋 CSVフォーマット

### 顧客管理用CSV（sample-customers.csv）

```csv
name,email,company,position,industry,sector
田中太郎,tanaka@example.com,株式会社サンプル,営業部長,IT,ソフトウェア開発
佐藤花子,sato@demo.co.jp,デモ株式会社,マーケティング担当,製造業,自動車製造
鈴木一郎,suzuki@test.jp,テスト商事,代表取締役,小売業,食品販売
```

### 必須フィールド
- `name` - 顧客名
- `email` - メールアドレス

### オプションフィールド
- `company` - 会社名
- `position` - 役職
- `industry` - 業界（例: IT、製造業、小売業）
- `sector` - 業種（例: ソフトウェア開発、自動車製造）

**注意:** 業界・業種は自動的にデータベースに登録され、フィルタリングに使用できます。

---

## 💡 使用例

### 例1: 新商品案内メール

**AI自動生成の指示:**
```
新商品発売のお知らせ、期間限定30%オフキャンペーン
```

**生成される本文（差し込み付き）:**
```
{name}様

いつもお世話になっております。

この度、新商品を発売いたしました！
期間限定で30%オフのキャンペーンを実施中です。

詳細はこちらからご確認ください。
```

**結果:**
- 田中太郎様宛: 「田中太郎様 いつもお世話に...」
- 佐藤花子様宛: 「佐藤花子様 いつもお世話に...」

### 例2: セミナー告知

**指示:**
```
無料オンラインセミナー開催のお知らせ、2025年12月1日14時
```

---

## 🛠 技術スタック

- **フロントエンド**: Next.js 16, React 19, TypeScript
- **スタイリング**: Tailwind CSS 4
- **AI**: Claude Sonnet 4 API (@anthropic-ai/sdk)
- **メール送信**: Nodemailer + SMTP
- **データベース**: Prisma + SQLite（150万件対応）
- **CSVパース**: PapaParse

---

## 📂 プロジェクト構造

```
/app
  /page.tsx                   # メール送信ページ
  /customers/page.tsx         # 顧客管理ページ（新規）
  /history/page.tsx           # 送信履歴ページ（新規）
  /layout.tsx                 # レイアウト
  /api
    /generate/route.ts              # HTMLメール生成API
    /generate-content/route.ts      # メール本文生成API
    /send/route.ts                  # 単一送信API
    /bulk-send/route.ts             # 一括送信API
    /customers/route.ts             # 顧客取得API（新規）
    /customers/[id]/route.ts        # 顧客CRUD API（新規）
    /customers/import/route.ts      # CSVインポートAPI（新規）
    /industries/route.ts            # 業界・業種API（新規）
/components
  /EmailForm.tsx              # 入力フォーム
  /BrandSettings.tsx          # ブランド設定
  /Preview.tsx                # プレビュー
  /CSVUpload.tsx              # CSVアップロード（ドラッグ&ドロップ対応）
  /CustomerList.tsx           # 顧客リスト表示
  /CustomerEditModal.tsx      # 顧客編集モーダル（新規）
  /BulkSendProgress.tsx       # 一括送信進捗
  /PersonalizedEmailList.tsx  # 個別メールリスト
/lib
  /types.ts                   # 型定義
  /generateEmail.ts           # HTML生成処理（Claude Sonnet）
  /generateEmailContent.ts    # 本文生成処理
  /sendEmail.ts               # メール送信処理
  /templateUtils.ts           # 差し込み機能
  /prisma.ts                  # Prismaクライアント（新規）
/prisma
  /schema.prisma              # データベーススキーマ（新規）
  /migrations/                # マイグレーション
```

---

## 🔧 トラブルシューティング

### APIキーエラー
```
Error: ANTHROPIC_API_KEY が設定されていません
```
→ `.env.local` に正しいAPIキーを設定

### SMTP設定エラー
```
Error: SMTP設定が不完全です
```
→ `.env.local` の全てのSMTP設定を確認

### Gmail送信エラー
- Gmailの2段階認証を有効化していますか？
- アプリパスワード（16桁）を使用していますか？（通常のパスワードはNG）

### CSV読み込みエラー
- CSVのフォーマットを確認: `name,email,company,position`
- BOM付きUTF-8で保存されていますか？

---

## 📊 制限事項

- **レート制限**: SMTPサーバーの送信制限に注意
  - Gmail: 1日500件まで
  - 送信間隔: 100ms（コードで調整可）

- **タイムアウト**: 大量送信時は時間がかかります
  - 100件 ≈ 3〜5分

---

## 🎯 今後の拡張予定

### 実装済み ✅
- [x] 送信履歴の保存
- [x] 顧客データベース管理
- [x] 業界・業種別フィルタリング
- [x] 顧客の個別編集・削除
- [x] 送信履歴から再送信
- [x] ドラッグ&ドロップCSVアップロード

### 未実装
- [ ] フィルター保存機能
- [ ] 送信スケジュール機能
- [ ] A/Bテスト機能
- [ ] 開封率トラッキング
- [ ] テンプレート保存機能
- [ ] ダークモード
- [ ] モバイル最適化
- [ ] PostgreSQL移行（本番環境）

---

## 📄 ライセンス

ISC

---

## 🙏 サポート

問題が発生した場合は、以下を確認してください：
1. `.env.local` の設定
2. サーバーログ（ターミナル）
3. ブラウザのコンソール

---

**💡 Tip**: まずは [sample-customers.csv](sample-customers.csv) でテスト送信してみましょう！

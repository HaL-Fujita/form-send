# 開発ログ - 2025/11/02

**プロジェクト:** 営業メール一括送信ツール (FUJI)

---

## 📌 実装サマリー

### セッション1（以前）
- ✅ UI/UXの改善（レイアウト統一、フッター実用化）
- ✅ 送信履歴の高度化（検索、フィルター、CSVエクスポート）
- ✅ 150万件対応の顧客管理システム（Prisma + SQLite）
- ✅ 業界・業種別フィルタリング機能
- ✅ メール送信との完全連携

### セッション2（本日）
- ✅ Claude Sonnet API への移行（CLAUDE.mdの仕様通り）
- ✅ 顧客の個別編集機能（編集・削除）
- ✅ 送信履歴から顧客リスト再利用機能
- ✅ ドラッグ&ドロップCSVアップロード機能

---

## 1. UI/UX改善

### 変更内容

| 箇所 | Before | After |
|------|--------|-------|
| **レイアウト** | カラムの高さ不揃い | `flex-1`で高さ統一 |
| **フッター** | 単純なリスト | 3カラムの実用カード |

**ファイル:** `app/page.tsx`

---

## 2. 送信履歴ページ強化

### 追加機能

1. **統計ダッシュボード** - 総送信回数/件数/成功率/失敗件数
2. **検索** - 件名、宛先名、メール、会社名
3. **フィルター** - 全て / 成功のみ / 失敗あり
4. **ソート** - 日付順 / 送信数順 / 成功率順
5. **CSVエクスポート** - 履歴データをダウンロード
6. **相対日付** - "5分前", "2時間前" など
7. **成功率可視化** - プログレスバーとグラデーション

**ファイル:** `app/history/page.tsx`

---

## 3. 顧客管理システム（150万件対応）

### データベース設計

```prisma
// 業界マスター
model Industry {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  sectors   Sector[]
  customers Customer[]
}

// 業種マスター
model Sector {
  id         Int      @id @default(autoincrement())
  name       String
  industryId Int
  customers  Customer[]
  @@unique([name, industryId])
}

// 顧客データ
model Customer {
  id         Int      @id @default(autoincrement())
  name       String
  email      String
  company    String?
  position   String?
  industryId Int?
  sectorId   Int?

  @@index([industryId])
  @@index([sectorId])
  @@index([email])
}
```

### API エンドポイント

| エンドポイント | 機能 |
|--------------|------|
| `POST /api/customers/import` | CSVインポート（1000件バッチ処理） |
| `GET /api/customers` | フィルター・ページネーション対応取得 |
| `GET /api/industries` | 業界・業種一覧取得 |

### 顧客管理ページ機能

**ファイル:** `app/customers/page.tsx`

- CSVインポート（進行状況表示）
- 業界・業種フィルター（左サイドバー）
- 検索機能
- 複数選択（チェックボックス）
- ページネーション（50件/ページ）
- メール送信連携

### メール送信連携

選択した顧客 → localStorage → メール送信ページで自動読み込み

**ファイル:** `app/page.tsx`

---

## 4. 技術スタック

| 技術 | 用途 |
|------|------|
| Next.js 16 | フレームワーク |
| React 19 | UI |
| TypeScript | 型安全性 |
| Tailwind CSS 4 | スタイリング |
| Prisma | ORM |
| SQLite | データベース |
| OpenAI GPT-4o | AI生成 |
| Nodemailer | メール送信 |

---

## 5. セットアップ

```bash
# 1. パッケージインストール
npm install prisma @prisma/client dotenv

# 2. Prisma初期化
npx prisma init --datasource-provider sqlite

# 3. マイグレーション実行
npx prisma migrate dev --name init

# 4. 開発サーバー起動
npm run dev
```

---

## 6. CSVインポートフォーマット

```csv
name,email,company,position,industry,sector
山田太郎,yamada@example.com,株式会社A,部長,IT,ソフトウェア開発
鈴木花子,suzuki@example.com,株式会社B,課長,製造業,自動車製造
```

**必須:** `name`, `email`
**オプション:** `company`, `position`, `industry`, `sector`

---

## 7. 使い方

### ワークフロー

```
1. 顧客管理 (/customers)
   ↓ CSVアップロード
   ↓ 業界・業種でフィルタリング
   ↓ チェックボックスで選択

2. メール送信 (/)
   ↓ 自動読み込み
   ↓ メール作成（AI生成可）
   ↓ 一括送信

3. 送信履歴 (/history)
   ↓ 結果確認
   ↓ CSVエクスポート
```

---

## 8. ファイル構成

```
FUJI/
├── app/
│   ├── page.tsx                    # メール送信（更新）
│   ├── customers/page.tsx          # 顧客管理（新規）
│   ├── history/page.tsx            # 送信履歴（更新）
│   └── api/
│       ├── customers/
│       │   ├── route.ts            # 顧客取得API（新規）
│       │   └── import/route.ts     # インポートAPI（新規）
│       └── industries/route.ts      # 業界・業種API（新規）
├── prisma/
│   ├── schema.prisma               # DBスキーマ（新規）
│   └── migrations/                 # マイグレーション
├── lib/
│   └── prisma.ts                   # Prismaクライアント（新規）
└── DEVELOPMENT_LOG.md              # このファイル
```

---

## 9. パフォーマンス

| 項目 | 数値 |
|------|------|
| 対応データ量 | 150万件 |
| バッチサイズ | 1000件/回 |
| ページサイズ | 50件/ページ |
| インデックス | 3個（industryId, sectorId, email） |

### 最適化手法

- バッチ処理（1000件ずつインポート）
- インデックス最適化（WHERE句の高速化）
- Map型キャッシュ（業界・業種の重複upsert削減）
- ページネーション（メモリ効率化）

---

## 10. セッション2の実装詳細（2025/11/02）

### 10.1 Claude Sonnet API への移行

**変更内容:**

CLAUDE.mdの仕様に基づき、OpenAI GPT-4oからClaude Sonnet APIへ移行

**ファイル:** `lib/generateEmail.ts`

**主な変更:**
- `@anthropic-ai/sdk` を使用
- モデル: `claude-sonnet-4-20250514`
- プロンプトをCLAUDE.mdの仕様に準拠
- 環境変数: `ANTHROPIC_API_KEY`

**設定ファイル:**
- `.env.example` を更新
- `.env.local` に `ANTHROPIC_API_KEY` を追加

---

### 10.2 顧客の個別編集機能

**追加ファイル:**
- `app/api/customers/[id]/route.ts` - 顧客のCRUD APIエンドポイント
- `components/CustomerEditModal.tsx` - 編集モーダルコンポーネント

**機能:**
1. 顧客情報の編集（名前、メール、会社名、役職、業界、業種）
2. 顧客の削除
3. メールアドレスの重複チェック
4. 業界変更時の業種自動リセット

**ファイル:** `app/customers/page.tsx`
- テーブルに「アクション」列を追加（編集・削除ボタン）
- 編集モーダルの統合

---

### 10.3 送信履歴から顧客リスト再利用機能

**機能:**
送信履歴から過去の宛先リストを選択して、再度メール送信できる

**ファイル:** `app/history/page.tsx`
- 送信詳細に「この宛先に再度メール送信」ボタンを追加
- 顧客リストをlocalStorageに保存して遷移

**ファイル:** `app/page.tsx`
- `from=history` パラメータをサポート
- 履歴からの顧客読み込み時のメッセージ表示

---

### 10.4 ドラッグ&ドロップCSVアップロード機能

**ファイル:** `components/CSVUpload.tsx`

**機能:**
1. ドラッグ&ドロップでCSVファイルをアップロード
2. ドラッグ中の視覚的フィードバック
3. ファイル選択ボタンとの併用
4. CSVファイル形式の検証

**UI改善:**
- ドラッグ&ドロップエリアのデザイン刷新
- ローディング状態の視覚化
- エラーメッセージの表示改善

---

## 11. 改善案（未実装）

### 機能
- [x] 顧客の個別編集 ✅ **実装完了**
- [x] 送信履歴から顧客リスト再利用 ✅ **実装完了**
- [ ] フィルター保存機能
- [x] ドラッグ&ドロップCSVアップロード ✅ **実装完了**

### パフォーマンス
- [ ] PostgreSQL移行（本番環境）
- [ ] Redisキャッシング
- [ ] 仮想スクロール

### UI/UX
- [ ] ダークモード
- [ ] モバイル最適化
- [ ] リアルタイムプレビュー

---

## まとめ

### Before（セッション1終了時）
- 150万件対応の顧客データベース
- 業界・業種別の高度なフィルタリング
- 検索・ソート・CSVエクスポート機能
- メール送信との完全連携
- OpenAI GPT-4oでのHTMLメール生成

### After（セッション2終了時）
- **Claude Sonnet APIへの移行（CLAUDE.md仕様準拠）**
- **顧客の個別編集・削除機能**
- **送信履歴からの顧客リスト再利用**
- **ドラッグ&ドロップCSVアップロード**
- **より洗練されたUX**

**結果:** CLAUDE.mdの仕様に準拠し、ユーザビリティが大幅に向上。顧客管理と送信履歴の連携が強化され、より効率的なメール送信ワークフローを実現しました。

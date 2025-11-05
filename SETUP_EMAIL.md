# メール送信機能のセットアップ方法

テストメール送信機能を使うには、SMTP設定が必要です。

## 📧 Gmail を使う場合（推奨）

### 1. Googleアプリパスワードを生成

1. Googleアカウントにログイン
2. https://myaccount.google.com/apppasswords にアクセス
3. 「アプリを選択」→「その他（カスタム名）」→「FUJI」と入力
4. 「生成」をクリック
5. 表示された16桁のパスワードをコピー（例: `abcd efgh ijkl mnop`）

### 2. .env.local を編集

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop  # スペースなしで入力
FROM_EMAIL=your-email@gmail.com
```

### 3. nodemailer をインストール

ターミナルで以下を実行：

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 4. サーバーを再起動

```bash
# Ctrl+C でサーバー停止
npm run dev
```

### 5. テスト送信

1. http://localhost:3000 を開く
2. メール本文を入力
3. 「HTMLプレビューを生成」をクリック
4. 「テストメール送信」セクションに自分のメールアドレスを入力
5. 「テストメールを送信」をクリック
6. 受信トレイを確認！

---

## 📨 他のSMTPサービスを使う場合

### SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=your-verified-email@example.com
```

### AWS SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
FROM_EMAIL=your-verified-email@example.com
```

### Outlook / Office 365

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
FROM_EMAIL=your-email@outlook.com
```

---

## ⚠️ トラブルシューティング

### 「メール送信が設定されていません」エラー

- `.env.local` ファイルが正しく設定されているか確認
- サーバーを再起動したか確認

### 「認証エラー」

- Gmailの場合、アプリパスワードを使用しているか確認（通常のパスワードは使えません）
- SMTP_PASS にスペースが含まれていないか確認

### メールが届かない

- 迷惑メールフォルダを確認
- FROM_EMAIL が正しく設定されているか確認
- SMTP_PORT が正しいか確認（Gmail: 587、SendGrid: 587）

---

## 💡 セキュリティのヒント

- `.env.local` は `.gitignore` に含まれており、Gitにコミットされません
- アプリパスワードは定期的に再生成することを推奨
- 本番環境では環境変数をサーバー設定で管理してください

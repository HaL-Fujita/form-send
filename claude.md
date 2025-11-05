# Claude Sonnet API プロンプト仕様

## 概要

このドキュメントは、HTMLメール生成ツールでClaude Sonnet APIに送信するプロンプトの仕様を定義します。

---

## プロンプトテンプレート

### 基本プロンプト

```
あなたはHTMLメール生成の専門家です。
以下のテキストを、メールクライアントで崩れにくい美しいHTMLメールに変換してください。

【入力テキスト】
{text}

【デザイン指定】
- プライマリカラー: {primaryColor}
- アクセントカラー: {accentColor}
- フォント: {font}

【必須要件】
- 単一のHTMLファイルとして出力（説明文は一切含めない）
- 幅は600px、中央寄せ
- スタイルは全てインラインCSS（style属性）で記述
- 外部CSS、外部フォント、<style>タグは使用禁止
- <script>、<form>、<video>、<iframe>は使用禁止

【推奨事項】
- 見出し（<h1>-<h3>）、段落（<p>）、箇条書き（<ul>、<ol>）を適切に使用
- CTAボタンは<a>タグで作成し、目立つようにスタイリング
- メールクライアント（Gmail、Outlook等）での表示を考慮
- 改行や段落を適切に配置して読みやすく

【出力】
HTMLコードのみを出力してください。前後の説明や```htmlなどのマークダウン記法は不要です。
```

---

## リクエスト例

### ケース1: シンプルなお知らせ

**入力テキスト:**
```
お世話になっております。

新商品のご案内です。

・商品A: 特別価格で提供中
・商品B: 期間限定セール
・商品C: 新発売

詳細はこちらからご確認ください。
```

**パラメータ:**
```json
{
  "text": "お世話になっております。\n\n新商品のご案内です。\n\n・商品A: 特別価格で提供中\n・商品B: 期間限定セール\n・商品C: 新発売\n\n詳細はこちらからご確認ください。",
  "primaryColor": "#2C3E50",
  "accentColor": "#E74C3C",
  "font": "sans-serif"
}
```

### ケース2: イベント告知

**入力テキスト:**
```
セミナー開催のお知らせ

日時: 2025年12月1日 14:00-16:00
場所: オンライン（Zoom）
参加費: 無料

今すぐ申し込む
```

**パラメータ:**
```json
{
  "text": "セミナー開催のお知らせ\n\n日時: 2025年12月1日 14:00-16:00\n場所: オンライン（Zoom）\n参加費: 無料\n\n今すぐ申し込む",
  "primaryColor": "#3498DB",
  "accentColor": "#F39C12",
  "font": "sans-serif"
}
```

---

## 期待される出力形式

### サンプル出力

```html
<div style="max-width:600px;margin:0 auto;background:#ffffff;font-family:sans-serif;">
  <div style="padding:40px 30px;">
    <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#333333;">お世話になっております。</p>

    <h2 style="margin:30px 0 20px 0;font-size:24px;color:#2C3E50;font-weight:bold;">新商品のご案内です。</h2>

    <ul style="margin:20px 0;padding-left:20px;line-height:1.8;color:#333333;">
      <li style="margin-bottom:10px;">商品A: 特別価格で提供中</li>
      <li style="margin-bottom:10px;">商品B: 期間限定セール</li>
      <li style="margin-bottom:10px;">商品C: 新発売</li>
    </ul>

    <p style="margin:30px 0 20px 0;font-size:16px;line-height:1.6;color:#333333;">詳細はこちらからご確認ください。</p>

    <a href="#" style="display:inline-block;padding:12px 30px;background:#E74C3C;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;margin-top:10px;">詳細を見る</a>
  </div>
</div>
```

---

## 制約事項

### 使用可能な要素
- `<div>`, `<p>`, `<h1>`, `<h2>`, `<h3>`
- `<ul>`, `<ol>`, `<li>`
- `<a>` (CTAボタン用)
- `<strong>`, `<em>`
- `<br>` (改行)

### 使用禁止の要素
- `<script>`
- `<style>` タグ
- `<form>`, `<input>`, `<button>`
- `<video>`, `<audio>`, `<iframe>`
- `<img>` (MVP版では使用しない)

### スタイリングルール
- 全てのスタイルは `style=""` 属性で指定
- 外部CSSファイルの参照禁止
- `@media` クエリ禁止（インラインでは使用不可）
- Web フォント（Google Fonts等）の使用禁止

---

## エラーハンドリング

### API失敗時のフォールバック

Claude APIが失敗した場合、以下のシンプルなテンプレートを使用：

```html
<div style="max-width:600px;margin:0 auto;padding:40px;background:#ffffff;font-family:sans-serif;border:1px solid #dddddd;border-radius:8px;">
  <p style="line-height:1.6;color:#333333;font-size:16px;white-space:pre-wrap;">{元のテキスト}</p>
</div>
```

### エラーパターン

| エラー | 対応 |
|--------|------|
| API接続失敗 | フォールバックテンプレート使用 |
| タイムアウト | フォールバックテンプレート使用 |
| 不正なHTML出力 | フォールバックテンプレート使用 |
| レート制限 | エラーメッセージ表示、再試行促す |

---

## API設定

### 推奨パラメータ

```javascript
{
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  temperature: 0.3,
  system: "あなたはHTMLメール生成の専門家です。",
  messages: [
    {
      role: "user",
      content: "[上記プロンプトテンプレート]"
    }
  ]
}
```

### 環境変数

```bash
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_API_VERSION=2023-06-01
```

---

## 実装例（Node.js）

```javascript
import Anthropic from '@anthropic-ai/sdk';

async function generateHTMLEmail(text, primaryColor, accentColor, font) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `あなたはHTMLメール生成の専門家です。
以下のテキストを、メールクライアントで崩れにくい美しいHTMLメールに変換してください。

【入力テキスト】
${text}

【デザイン指定】
- プライマリカラー: ${primaryColor}
- アクセントカラー: ${accentColor}
- フォント: ${font}

【必須要件】
- 単一のHTMLファイルとして出力（説明文は一切含めない）
- 幅は600px、中央寄せ
- スタイルは全てインラインCSS（style属性）で記述
- 外部CSS、外部フォント、<style>タグは使用禁止
- <script>、<form>、<video>、<iframe>は使用禁止

【推奨事項】
- 見出し（<h1>-<h3>）、段落（<p>）、箇条書き（<ul>、<ol>）を適切に使用
- CTAボタンは<a>タグで作成し、目立つようにスタイリング
- メールクライアント（Gmail、Outlook等）での表示を考慮
- 改行や段落を適切に配置して読みやすく

【出力】
HTMLコードのみを出力してください。前後の説明や\`\`\`htmlなどのマークダウン記法は不要です。`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error);
    // フォールバック
    return `<div style="max-width:600px;margin:0 auto;padding:40px;background:#ffffff;font-family:sans-serif;border:1px solid #dddddd;border-radius:8px;">
  <p style="line-height:1.6;color:#333333;font-size:16px;white-space:pre-wrap;">${text}</p>
</div>`;
  }
}

export default generateHTMLEmail;
```

---

## テスト方法

1. 様々なテキストパターンでテスト
   - 短文
   - 長文
   - 箇条書き
   - 数字リスト
   - CTA含む

2. 異なるメールクライアントで確認
   - Gmail (Web)
   - Outlook (Web/Desktop)
   - Apple Mail
   - Yahoo Mail

3. レスポンシブ確認
   - PC表示
   - モバイル表示

---

## 注意事項

- API使用料金に注意（トークン数を監視）
- レート制限を考慮（連続送信時）
- 個人情報を含むテキストの取り扱いに注意
- 生成されたHTMLは常にサニタイズ処理を実施

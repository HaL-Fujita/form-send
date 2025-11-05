import OpenAI from 'openai';

interface GenerateEmailParams {
  text: string;
  primaryColor: string;
  accentColor: string;
  font: string;
}

/**
 * OpenAI APIを使用してHTMLメールを生成する
 * 営業メール用の読みやすいデザイン
 */
export async function generateHTMLEmail({
  text,
  primaryColor,
  accentColor,
  font,
}: GenerateEmailParams): Promise<string> {
  // APIキーの確認
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('OPENAI_API_KEY が設定されていません');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // プロンプトテンプレート（営業メール用の読みやすいデザイン）
  const prompt = `あなたはプロフェッショナルなHTMLメールデザイナーです。
以下の営業メールテキストを、**人間が読みやすく、目に優しく、ストレスなく内容が理解でき、相手に好印象を与える**HTMLメールに変換してください。

【重要】これは営業メールです。プロフェッショナルで信頼感のあるデザインにしてください。

【入力テキスト（営業メール）】
${text}

【カラーパレット】
- プライマリカラー: ${primaryColor}（見出し、重要な要素に使用）
- アクセントカラー: ${accentColor}（CTAボタン、強調箇所に使用）
- フォント: ${font}

【必須要件】
- 単一のHTMLファイルとして出力（説明文は一切含めない）
- 幅は600px、中央寄せ
- スタイルは全てインラインCSS（style属性）で記述
- 外部CSS、外部フォント、<style>タグは使用禁止
- <script>、<form>、<video>、<iframe>は使用禁止

【読みやすさ最優先のデザイン指示】

📖 テキストの読みやすさ（最重要）:
- 本文のフォントサイズ: 16px〜18px（小さすぎると読みにくい）
- 行間: line-height: 1.8〜2.0（ゆったりとした行間で目が疲れない）
- 段落間の余白: margin-bottom: 20px〜28px（段落の区切りを明確に）
- 文字色: #2c3e50 または #333333（真っ黒より少し柔らかい色で目に優しい）
- 1行の文字数: 適度な幅（長すぎる行は読みにくい）

🎯 情報の階層構造:
- h1（メインタイトル）: ${primaryColor}、font-size: 28px〜32px、font-weight: bold、margin-bottom: 24px
- h2（セクション見出し）: ${primaryColor}、font-size: 22px〜24px、font-weight: bold、margin: 32px 0 16px 0
- h3（小見出し）: ${primaryColor}、font-size: 18px〜20px、font-weight: 600、margin: 24px 0 12px 0
- 見出しと本文の間に適切な余白を確保（視覚的な区切り）

📋 リスト・箇条書きの見やすさ:
- 項目間の余白: margin-bottom: 12px〜16px
- 行間: line-height: 1.9
- 左側に視覚的なマーカー（●や数字）
- インデント: padding-left: 24px
- 各項目は読みやすい文字サイズ（16px以上）

✨ 全体的なレイアウト:
- 背景色: #f8f9fa（柔らかい印象）
- カード背景: #ffffff
- カードの影: box-shadow: 0 2px 12px rgba(0,0,0,0.08)
- カードの角丸: border-radius: 12px
- カード内のパディング: 40px 48px（窮屈にならないよう余裕を持たせる）
- ヘッダーエリア: ${primaryColor}の薄い背景（opacity: 0.06）、padding: 32px

🎨 視覚的な快適さ:
- コントラスト比を確保（文字が見やすい）
- 区切り線は控えめ（1px solid #e8e8e8）
- 重要な情報は適度に強調（太字、色）
- 視線が自然に上から下へ流れる構成
- 余白を惜しまない（詰め込みすぎない）

📱 スマートフォンでの見やすさも考慮:
- フォントサイズは十分に大きく
- タップしやすい要素サイズ
- パディング・マージンは十分に

🎨 色の使い方（重要）:
- プライマリカラー（${primaryColor}）を見出しや重要な要素に積極的に使用してください
- アクセントカラー（${accentColor}）を強調箇所や重要なポイントに使用してください
- 単調な黒文字だけにならないよう、色を効果的に使ってください
- ヘッダーエリアの背景にプライマリカラーの薄い色（opacity: 0.06〜0.1）を使用
- 重要なキーワードや数字をアクセントカラーで強調
- 色を使うことで、視覚的に魅力的で読みやすいメールにしてください

⚠️ 重要な制約:
- 入力テキストに書かれている内容「だけ」を美しくレイアウトしてください
- 勝手にCTAボタンや「お問い合わせはこちら」などの文言を追加しないでください
- 入力テキストにない情報は一切追加しないでください
- リンクURLが明示されていない場合、ボタンやリンクを作成しないでください

【出力】
HTMLコードのみを出力してください。前後の説明や\`\`\`htmlなどのマークダウン記法は不要です。`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'あなたはHTMLメール生成の専門家です。指示に従って、HTMLコードのみを出力してください。マークダウン記法（```html）や説明文は一切含めず、純粋なHTMLコードのみを返してください。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    });

    // レスポンスからテキストを取得
    let html = completion.choices[0]?.message?.content?.trim();
    if (!html) {
      throw new Error('予期しないレスポンス形式');
    }

    console.log('=== OpenAI生HTMLレスポンス（最初の200文字）===');
    console.log(html.substring(0, 200));

    // マークダウン記法を除去（より強力に）
    const beforeClean = html;

    // 1. ```html ... ``` を除去
    html = html.replace(/^```html\s*/i, '').replace(/\s*```$/, '');

    // 2. ``` ... ``` を除去
    html = html.replace(/^```\s*/,'').replace(/\s*```$/, '');

    // 3. 念のため、途中に残っている可能性のあるバッククォートも除去
    html = html.replace(/^`+\s*/, '').replace(/\s*`+$/, '');

    // 4. HTMLタグで始まっていない場合、最初のHTMLタグまでの説明文を削除
    if (!html.trim().startsWith('<')) {
      const htmlStartMatch = html.match(/<[a-z]/i);
      if (htmlStartMatch) {
        html = html.substring(htmlStartMatch.index!);
      }
    }

    if (beforeClean !== html) {
      console.log('=== マークダウン記法/説明文を除去しました ===');
    }

    console.log('=== クリーニング後のHTML（最初の200文字）===');
    console.log(html.substring(0, 200));

    return html;
  } catch (error) {
    console.error('OpenAI API Error:', error);

    // フォールバックテンプレート
    return `<div style="max-width:600px;margin:0 auto;padding:40px;background:#ffffff;font-family:${font};border:1px solid #dddddd;border-radius:8px;">
  <p style="line-height:1.6;color:#333333;font-size:16px;white-space:pre-wrap;">${text}</p>
</div>`;
  }
}

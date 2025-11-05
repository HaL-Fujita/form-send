import OpenAI from 'openai';

interface GenerateContentParams {
  instruction: string;
  subject?: string;
}

export interface GeneratedEmailContent {
  content: string;
  primaryColor: string;
  accentColor: string;
}

/**
 * OpenAI APIを使用してメール本文と色を自動生成する
 */
export async function generateEmailContent({
  instruction,
  subject,
}: GenerateContentParams): Promise<GeneratedEmailContent> {
  // APIキーの確認
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('OPENAI_API_KEY が設定されていません');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // プロンプト作成
  const prompt = `あなたはプロフェッショナルなビジネスメールライターです。
以下の指示に基づいて、適切なビジネスメールの本文を日本語で作成し、メールの内容に合った色も提案してください。

【指示】
${instruction}

${subject ? `【件名】\n${subject}\n` : ''}

【要件】
- ビジネスメールとして適切な文体と構成
- 簡潔で分かりやすい文章
- 必要に応じて箇条書きを使用
- 適切な挨拶と結びの言葉
- 改行を適切に使用して読みやすく

【色の選択】
- メールの内容や雰囲気に合ったプライマリカラーとアクセントカラーを提案
- 例：新商品発売 → 明るい青/オレンジ、重要なお知らせ → 紺/赤、感謝の言葉 → 緑/金色
- 16進数カラーコード（例：#2C3E50）で指定

【出力形式】
以下のJSON形式で出力してください。JSONのみを出力し、説明や前置きは不要です：
{
  "content": "メール本文",
  "primaryColor": "#2C3E50",
  "accentColor": "#E74C3C"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    // レスポンスからテキストを取得
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('予期しないレスポンス形式');
    }

    // JSONブロックの前後の```を削除
    const jsonText = text.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '');

    try {
      const parsed = JSON.parse(jsonText) as GeneratedEmailContent;

      // 必須フィールドのチェック
      if (!parsed.content || !parsed.primaryColor || !parsed.accentColor) {
        throw new Error('必須フィールドが不足しています');
      }

      return parsed;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Received text:', text);

      // フォールバック：テキストのみとして扱う
      return {
        content: text,
        primaryColor: '#2C3E50',
        accentColor: '#E74C3C',
      };
    }
  } catch (error) {
    console.error('OpenAI API Error (generateEmailContent):', error);
    throw new Error('メール本文の生成に失敗しました');
  }
}

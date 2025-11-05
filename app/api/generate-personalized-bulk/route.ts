import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Customer } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { customers, instruction, subject } = await req.json();

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: "顧客リストが必要です" },
        { status: 400 }
      );
    }

    if (!instruction || !instruction.trim()) {
      return NextResponse.json(
        { error: "メール生成の指示を入力してください" },
        { status: 400 }
      );
    }

    // 各顧客ごとに個別のメールを生成
    const results = await Promise.all(
      customers.map(async (customer: Customer) => {
        try {
          const prompt = `あなたはプロフェッショナルな営業メールライターです。

以下の顧客情報に基づいて、パーソナライズされた営業メールを作成してください。

【顧客情報】
- 名前: ${customer.name}
- 会社名: ${customer.company || "不明"}
- 役職: ${customer.position || "不明"}

【営業メールの目的・指示】
${instruction}

${subject ? `【件名】\n${subject}` : ""}

【営業メールの重要な要件】
🎯 営業メールとしての基本:
- これは営業メールであることを前提に作成してください
- 相手にとっての具体的なメリット・価値を明確に伝える
- 押し付けがましくなく、親しみやすく読みやすいトーンにする
- 相手の課題や関心事に寄り添った内容にする

⚠️ 文体の注意（重要）:
- 適度にビジネスの礼儀を保ちつつ、読みやすく親しみやすい文章にする
- 最低限の挨拶（「お世話になっております」など）は使用してOK
- 過度に形式的な表現（「拝啓」「敬具」「何卒よろしくお願い申し上げます」など）は避ける
- 丁寧だが堅苦しすぎない、ビジネスメールとして適切なトーンを保つ
- 要点をわかりやすく、簡潔に伝える

👤 パーソナライゼーション:
- この顧客の役職や会社に合わせた内容にする
- 役職が高い人（CEO、部長など）には戦略的・経営的な観点から訴求
- 役職が実務者（担当者など）には実務的・具体的な観点から訴求
- 会社名や役職を自然に文中で活用する

✍️ 文章の質:
- 丁寧語は使うが、過度に形式的にしない
- 具体的で説得力のある内容にする
- 簡潔で読みやすく、要点を明確に
- 相手の時間を尊重した長さにする

【出力形式】
件名と本文を以下の形式で出力してください：

件名: （ここに件名）

本文:
（ここに本文）`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "あなたはプロフェッショナルな営業メールライターです。顧客の役職や立場に合わせて、相手にとって価値のある営業メールを作成します。適度にビジネスの礼儀を保ちつつ、読みやすく親しみやすい文体で、相手のメリットを明確に伝える営業メールのプロフェッショナルです。",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });

          const responseText = completion.choices[0]?.message?.content || "";

          // 件名と本文を分離
          const subjectMatch = responseText.match(/件名[：:]\s*(.+)/);
          const bodyMatch = responseText.match(/本文[：:]\s*([\s\S]+)/);

          const generatedSubject = subjectMatch
            ? subjectMatch[1].trim()
            : subject || "お知らせ";
          const generatedBody = bodyMatch
            ? bodyMatch[1].trim()
            : responseText;

          return {
            customerId: customer.id,
            subject: generatedSubject,
            body: generatedBody,
            success: true,
          };
        } catch (error) {
          console.error(`顧客 ${customer.name} のメール生成エラー:`, error);
          return {
            customerId: customer.id,
            subject: subject || "",
            body: "",
            success: false,
            error: error instanceof Error ? error.message : "生成エラー",
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("一括メール生成エラー:", error);
    return NextResponse.json(
      {
        error: "一括メール生成に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}

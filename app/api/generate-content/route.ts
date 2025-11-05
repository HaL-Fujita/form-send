import { NextRequest, NextResponse } from 'next/server';
import { generateEmailContent } from '@/lib/generateEmailContent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, subject } = body;

    // バリデーション
    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json(
        { error: 'メール生成の指示を入力してください' },
        { status: 400 }
      );
    }

    // メール本文と色を生成
    const result = await generateEmailContent({
      instruction,
      subject,
    });

    return NextResponse.json({
      success: true,
      content: result.content,
      primaryColor: result.primaryColor,
      accentColor: result.accentColor,
    });
  } catch (error) {
    console.error('Generate Content API Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : '不明なエラーが発生しました';

    return NextResponse.json(
      {
        error: 'メール本文の生成に失敗しました',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

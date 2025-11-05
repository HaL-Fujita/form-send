import { NextRequest, NextResponse } from 'next/server';
import { generateHTMLEmail } from '@/lib/generateEmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, primaryColor, accentColor, font } = body;

    // バリデーション
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '本文テキストが必要です' },
        { status: 400 }
      );
    }

    // HTMLメール生成
    const htmlContent = await generateHTMLEmail({
      text,
      primaryColor: primaryColor || '#2C3E50',
      accentColor: accentColor || '#E74C3C',
      font: font || 'sans-serif',
    });

    return NextResponse.json({
      success: true,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Generate API Error:', error);

    // エラーメッセージの詳細を返す
    const errorMessage =
      error instanceof Error ? error.message : '不明なエラーが発生しました';

    return NextResponse.json(
      {
        error: 'HTMLメールの生成に失敗しました',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, htmlContent } = body;

    // バリデーション
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { error: '件名を入力してください' },
        { status: 400 }
      );
    }

    if (!htmlContent || typeof htmlContent !== 'string') {
      return NextResponse.json(
        { error: 'HTMLコンテンツが必要です' },
        { status: 400 }
      );
    }

    // メール送信
    await sendEmail({
      to,
      subject,
      htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: 'メールを送信しました',
    });
  } catch (error) {
    console.error('Send API Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : '不明なエラーが発生しました';

    return NextResponse.json(
      {
        error: 'メール送信に失敗しました',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

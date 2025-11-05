import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: '送信先、件名、本文は必須です' },
        { status: 400 }
      );
    }

    // メールアドレスの簡易検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: '正しいメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // 環境変数チェック
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || smtpUser;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          error: 'メール送信が設定されていません',
          details: 'SMTP設定を.env.localに追加してください（SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL）'
        },
        { status: 500 }
      );
    }

    // Nodemailer トランスポーター設定
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // 465ならtrue、587ならfalse
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // メール送信
    await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: `[テスト] ${subject}`,
      html: html,
    });

    return NextResponse.json({
      success: true,
      message: `テストメールを ${to} に送信しました`,
    });
  } catch (error) {
    console.error('テストメール送信エラー:', error);
    return NextResponse.json(
      {
        error: 'メール送信に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 }
    );
  }
}

import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

/**
 * Nodemailerを使用してHTMLメールを送信する
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
}: SendEmailParams): Promise<void> {
  // SMTP設定の確認
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('SMTP設定が不完全です。.env.localを確認してください。');
  }

  // Nodemailer transporterを作成
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465, // 465ならtrue、587ならfalse
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // メール送信オプション
  const mailOptions = {
    from: smtpUser,
    to: to,
    subject: subject,
    html: htmlContent,
  };

  try {
    // メール送信
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('メール送信に失敗しました');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/sendEmail';
import { generateHTMLEmail } from '@/lib/generateEmail';
import { applyTemplate } from '@/lib/templateUtils';
import { Customer, BulkSendResult, SendResult } from '@/lib/types';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customers, subject, bodyTemplate, primaryColor, accentColor, font } = body;

    // バリデーション
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: '顧客リストが必要です' },
        { status: 400 }
      );
    }

    if (!subject || !bodyTemplate) {
      return NextResponse.json(
        { error: '件名と本文テンプレートが必要です' },
        { status: 400 }
      );
    }

    const results: SendResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    // 各顧客にメールを送信
    for (const customer of customers as Customer[]) {
      try {
        // 1. 個別生成されたメールがあればそれを使用、なければテンプレートを使用
        const personalizedBody = customer.personalizedBody
          ? customer.personalizedBody
          : applyTemplate(bodyTemplate, customer);
        const personalizedSubject = customer.personalizedSubject
          ? customer.personalizedSubject
          : applyTemplate(subject, customer);

        // 2. HTMLメールを生成
        const htmlContent = await generateHTMLEmail({
          text: personalizedBody,
          primaryColor: primaryColor || '#2C3E50',
          accentColor: accentColor || '#E74C3C',
          font: font || 'sans-serif',
        });

        // 3. メール送信
        await sendEmail({
          to: customer.email,
          subject: personalizedSubject,
          htmlContent,
        });

        results.push({
          customerId: customer.id,
          customerEmail: customer.email,
          customerName: customer.name,
          success: true,
          sentAt: new Date(),
        });

        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '送信失敗';

        results.push({
          customerId: customer.id,
          customerEmail: customer.email,
          customerName: customer.name,
          success: false,
          error: errorMessage,
        });

        failedCount++;
      }

      // レート制限対策: 各送信の間に少し待機（SMTPサーバーの負荷軽減）
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const bulkResult: BulkSendResult = {
      total: customers.length,
      success: successCount,
      failed: failedCount,
      results,
    };

    // サンプルHTMLを生成（最初の顧客のメールで代表）
    let sampleHtml = null;
    if (customers.length > 0) {
      try {
        const firstCustomer = customers[0] as Customer;
        const sampleBody = firstCustomer.personalizedBody
          ? firstCustomer.personalizedBody
          : applyTemplate(bodyTemplate, firstCustomer);
        sampleHtml = await generateHTMLEmail({
          text: sampleBody,
          primaryColor: primaryColor || '#2C3E50',
          accentColor: accentColor || '#E74C3C',
          font: font || 'sans-serif',
        });
      } catch (error) {
        console.error('サンプルHTML生成エラー:', error);
      }
    }

    // データベースに送信履歴を保存
    try {
      await prisma.sendHistory.create({
        data: {
          subject,
          bodyTemplate,
          htmlContent: sampleHtml,
          totalRecipients: customers.length,
          successCount,
          failedCount,
          primaryColor: primaryColor || '#2C3E50',
          accentColor: accentColor || '#E74C3C',
          font: font || 'sans-serif',
          recipients: JSON.stringify(customers),
        },
      });
      console.log('✅ 送信履歴をDBに保存しました');
    } catch (dbError) {
      console.error('❌ DB保存エラー:', dbError);
      // DB保存に失敗してもメール送信は成功しているので、エラーにはしない
    }

    return NextResponse.json({
      success: true,
      result: bulkResult,
    });
  } catch (error) {
    console.error('Bulk Send API Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : '不明なエラーが発生しました';

    return NextResponse.json(
      {
        error: '一括送信に失敗しました',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // 送信履歴を取得（最新順）
    const [histories, total] = await Promise.all([
      prisma.sendHistory.findMany({
        orderBy: {
          sentAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.sendHistory.count(),
    ]);

    // JSON文字列をパースして返す
    const formattedHistories = histories.map((history) => ({
      id: history.id.toString(),
      subject: history.subject,
      bodyTemplate: history.bodyTemplate,
      htmlContent: history.htmlContent,
      totalRecipients: history.totalRecipients,
      successCount: history.successCount,
      failedCount: history.failedCount,
      primaryColor: history.primaryColor,
      accentColor: history.accentColor,
      font: history.font,
      customers: JSON.parse(history.recipients),
      sentAt: history.sentAt,
    }));

    return NextResponse.json({
      histories: formattedHistories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('履歴取得エラー:', error);
    return NextResponse.json(
      {
        error: '履歴の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 }
    );
  }
}

// 特定の履歴を取得
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '履歴IDが必要です' },
        { status: 400 }
      );
    }

    const history = await prisma.sendHistory.findUnique({
      where: { id: parseInt(id) },
    });

    if (!history) {
      return NextResponse.json(
        { error: '履歴が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      history: {
        id: history.id.toString(),
        subject: history.subject,
        bodyTemplate: history.bodyTemplate,
        htmlContent: history.htmlContent,
        totalRecipients: history.totalRecipients,
        successCount: history.successCount,
        failedCount: history.failedCount,
        primaryColor: history.primaryColor,
        accentColor: history.accentColor,
        font: history.font,
        customers: JSON.parse(history.recipients),
        sentAt: history.sentAt,
      },
    });
  } catch (error) {
    console.error('履歴詳細取得エラー:', error);
    return NextResponse.json(
      {
        error: '履歴の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 }
    );
  }
}

// 全ての履歴を削除
export async function DELETE(request: NextRequest) {
  try {
    await prisma.sendHistory.deleteMany({});

    return NextResponse.json({
      success: true,
      message: '全ての履歴を削除しました',
    });
  } catch (error) {
    console.error('履歴一括削除エラー:', error);
    return NextResponse.json(
      {
        error: '履歴の削除に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 }
    );
  }
}

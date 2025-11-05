import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// インポート履歴を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const histories = await prisma.importHistory.findMany({
      orderBy: { importedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      histories: histories,
    });
  } catch (error) {
    console.error('Import history fetch error:', error);
    return NextResponse.json(
      {
        error: 'インポート履歴の取得に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// インポート履歴を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // 個別削除
      await prisma.importHistory.delete({
        where: { id: parseInt(id) },
      });

      return NextResponse.json({
        success: true,
        message: 'インポート履歴を削除しました',
      });
    } else {
      // 全削除
      await prisma.importHistory.deleteMany({});

      return NextResponse.json({
        success: true,
        message: '全てのインポート履歴を削除しました',
      });
    }
  } catch (error) {
    console.error('Import history delete error:', error);
    return NextResponse.json(
      {
        error: 'インポート履歴の削除に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

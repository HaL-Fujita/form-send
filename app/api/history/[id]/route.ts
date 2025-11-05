import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 特定の履歴を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '無効な履歴IDです' },
        { status: 400 }
      );
    }

    await prisma.sendHistory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '履歴を削除しました',
    });
  } catch (error) {
    console.error('履歴削除エラー:', error);
    return NextResponse.json(
      {
        error: '履歴の削除に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 }
    );
  }
}

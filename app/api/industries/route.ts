import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const industries = await prisma.industry.findMany({
      include: {
        sectors: true,
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ industries });

  } catch (error) {
    console.error('Industries fetch error:', error);
    return NextResponse.json(
      {
        error: '業界データの取得に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

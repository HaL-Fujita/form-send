import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const industryId = searchParams.get('industryId');
    const sectorId = searchParams.get('sectorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // フィルタ条件を構築
    const where: any = {};

    if (industryId) {
      where.industryId = parseInt(industryId);
    }

    if (sectorId) {
      where.sectorId = parseInt(sectorId);
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ];
    }

    // 顧客データを取得（ページネーション付き）
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          industry: true,
          sector: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Customers fetch error:', error);
    return NextResponse.json(
      {
        error: '顧客データの取得に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 全顧客データを削除
export async function DELETE(request: NextRequest) {
  try {
    const result = await prisma.customer.deleteMany({});

    console.log('=== All Customers Deleted ===');
    console.log('Deleted count:', result.count);

    return NextResponse.json({
      success: true,
      message: `${result.count}件の顧客データを削除しました`,
      deletedCount: result.count,
    });

  } catch (error) {
    console.error('Delete all customers error:', error);
    return NextResponse.json(
      {
        error: '顧客データの削除に失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

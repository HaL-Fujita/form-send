import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 顧客情報の更新（個別編集）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: '無効な顧客ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, company, position, industryId, sectorId } = body;

    // バリデーション
    if (!name || !email) {
      return NextResponse.json(
        { error: '名前とメールアドレスは必須です' },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック（自分以外）
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: email,
        NOT: {
          id: customerId,
        },
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    // 顧客情報を更新
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        email,
        company: company || null,
        position: position || null,
        industryId: industryId || null,
        sectorId: sectorId || null,
      },
      include: {
        industry: true,
        sector: true,
      },
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error('顧客更新エラー:', error);
    return NextResponse.json(
      { error: '顧客情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 顧客の削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: '無効な顧客ID' },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({
      success: true,
      message: '顧客を削除しました',
    });
  } catch (error) {
    console.error('顧客削除エラー:', error);
    return NextResponse.json(
      { error: '顧客の削除に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 顧客情報の取得（個別）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: '無効な顧客ID' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        industry: true,
        sector: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: '顧客が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('顧客取得エラー:', error);
    return NextResponse.json(
      { error: '顧客情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

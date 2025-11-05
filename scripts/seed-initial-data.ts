import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 業界データ
  const industries = [
    { name: 'IT・テクノロジー', sectors: ['SaaS・クラウドサービス', 'システム開発', 'Web制作'] },
    { name: '金融', sectors: ['銀行・証券', '保険', 'フィンテック'] },
    { name: '小売・EC', sectors: ['EC・通販', '百貨店', 'コンビニ'] },
    { name: '医療・ヘルスケア', sectors: ['病院・クリニック', '製薬', '医療機器'] },
    { name: '教育', sectors: ['オンライン教育', '学習塾', '大学・専門学校'] },
    { name: '製造業', sectors: ['自動車・部品', '電子機器', '食品'] },
    { name: 'コンサルティング', sectors: ['経営コンサルティング', 'ITコンサルティング', '人材コンサルティング'] },
    { name: '物流・運輸', sectors: ['宅配・配送', '倉庫管理', '国際物流'] },
    { name: '不動産', sectors: ['賃貸・管理', '売買仲介', '建設'] },
  ];

  for (const industryData of industries) {
    const industry = await prisma.industry.upsert({
      where: { name: industryData.name },
      update: {},
      create: { name: industryData.name },
    });

    console.log(`✅ Created industry: ${industry.name}`);

    for (const sectorName of industryData.sectors) {
      const sector = await prisma.sector.upsert({
        where: {
          name_industryId: {
            name: sectorName,
            industryId: industry.id,
          },
        },
        update: {},
        create: {
          name: sectorName,
          industryId: industry.id,
        },
      });
      console.log(`  ✅ Created sector: ${sector.name}`);
    }
  }

  console.log('');
  console.log('🎉 Database seed completed!');
  console.log('');
  console.log('Summary:');
  console.log(`  Industries: ${industries.length}`);
  console.log(`  Sectors: ${industries.reduce((sum, i) => sum + i.sectors.length, 0)}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

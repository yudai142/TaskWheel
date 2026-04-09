const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Seeding database...');

    // 既存レコード数をチェック
    console.log('📊 Checking data count...');
    const existingMembers = await prisma.member.count();
    const existingWorks = await prisma.work.count();
    console.log(`📊 Current data: Members: ${existingMembers}, Works: ${existingWorks}`);

    // どちらかにデータがない場合はシードを実行
    if (existingMembers === 0 || existingWorks === 0) {
      console.log('📝 Starting seed data insertion...');

      // メンバーデータの挿入
      const memberData = [
        { familyName: 'テスト', givenName: '太郎', kanaName: 'てすとたろう', archive: true },
        { familyName: 'テスト', givenName: '花子', kanaName: 'てすとはなこ', archive: true },
        { familyName: '釘子', givenName: '津佳冴', kanaName: 'くぎこつかさ', archive: false },
        { familyName: '長谷川', givenName: '異風', kanaName: 'はせがわいふう', archive: false },
        { familyName: '樋口', givenName: '伊吹', kanaName: 'ひぐちいぶき', archive: false },
        { familyName: '小泉', givenName: '俊一', kanaName: 'こいずみしゅんいち', archive: false },
        { familyName: '北川', givenName: '優斗', kanaName: 'きたがわゆうと', archive: false },
        { familyName: '小股', givenName: '晄', kanaName: 'おまたあき', archive: false },
        { familyName: '田鹿', givenName: '蒼史', kanaName: 'たじかそうじ', archive: false },
        { familyName: '芦生', givenName: '浩明', kanaName: 'あしおひろあき', archive: false },
        { familyName: '高宮城', givenName: '誉有治', kanaName: 'たかみやぎようき', archive: false },
        { familyName: '朴', givenName: '清', kanaName: 'ぼくきよし', archive: false },
        { familyName: '西加治工', givenName: '祐樹', kanaName: 'にしかじくゆうき', archive: false },
        { familyName: '雉子谷', givenName: '茂夫', kanaName: 'きじだにしげお', archive: false },
        { familyName: '渡谷', givenName: '身志', kanaName: 'わたりやみり', archive: false },
        { familyName: '室石', givenName: '遙摯', kanaName: 'むろいしはると', archive: false },
        { familyName: '塩足', givenName: '壱', kanaName: 'しおたりいち', archive: false },
        { familyName: '筒屋', givenName: '厳春', kanaName: 'つつやみねはる', archive: false },
        { familyName: '日陰茂井', givenName: '昊', kanaName: 'ひかげもいそら', archive: false },
        { familyName: '精廬', givenName: '里備', kanaName: 'とぐろさとはる', archive: false },
        { familyName: '喜美候部', givenName: '智絃', kanaName: 'きみこうべちづる', archive: false },
        { familyName: '竹乘', givenName: '成也', kanaName: 'たけのりなりや', archive: false },
        { familyName: '安達', givenName: '城灯', kanaName: 'あだちきと', archive: false },
        { familyName: '森田', givenName: '悠翔', kanaName: 'もりたはると', archive: false },
        { familyName: '矢野', givenName: '英一', kanaName: 'やのえいいち', archive: false },
        { familyName: '誉田', givenName: '和樹', kanaName: 'ほまれだかずき', archive: false },
        { familyName: '数', givenName: '瑛斗', kanaName: 'かずえいと', archive: false },
      ];

      if (existingMembers === 0) {
        console.log(`📝 Inserting ${memberData.length} members...`);
        const createdMembers = await prisma.member.createMany({
          data: memberData,
          skipDuplicates: true,
        });
        console.log(`✅ Inserted ${createdMembers.count} members`);
      } else {
        console.log(`ℹ️  Members already exist (${existingMembers} records). Skipping member seed.`);
      }

      // 作業データの挿入
      const workData = [
        { name: 'リーダー', multiple: 1, archive: false },
        { name: 'ハンディモップ', multiple: 1, archive: false },
        { name: 'アクリルボード', multiple: 1, archive: false },
        { name: 'ガラス拭き', multiple: 1, archive: false },
        { name: '除菌シート', multiple: 1, archive: false },
        { name: '窓の出っ張り', multiple: 1, archive: false },
        { name: 'コロコロ', multiple: 1, archive: false },
        { name: 'アルコール拭き', multiple: 1, archive: false },
        { name: '水拭き', multiple: 1, archive: false },
        { name: 'ゴミ捨て', multiple: 1, archive: false },
        { name: '掃除機', multiple: 1, archive: true },
      ];

      if (existingWorks === 0) {
        console.log(`📝 Inserting ${workData.length} works...`);
        const createdWorks = await prisma.work.createMany({
          data: workData,
          skipDuplicates: true,
        });
        console.log(`✅ Inserted ${createdWorks.count} works`);
      } else {
        console.log(`ℹ️  Works already exist (${existingWorks} records). Skipping work seed.`);
      }

      console.log('✅ Seed completed successfully!');
    } else {
      console.log('ℹ️  Database already contains data. Skipping seed...');
    }
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    console.log('🔌 Disconnecting Prisma Client...');
    await prisma.$disconnect();
    console.log('✓ Disconnected');
  }
}

main();

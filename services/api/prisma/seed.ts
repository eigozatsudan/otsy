import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@otsy.local' },
    update: {},
    create: {
      email: 'admin@otsy.local',
      password_hash: adminPassword,
      role: 'manager',
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@otsy.local' },
    update: {},
    create: {
      email: 'user@otsy.local',
      password_hash: userPassword,
      phone: '+81-90-1234-5678',
      subscription_tier: 'basic',
    },
  });

  // Create test shopper user first
  const shopperUserPassword = await bcrypt.hash('shopper123', 10);
  const shopperUser = await prisma.user.upsert({
    where: { email: 'shopper@otsy.local' },
    update: {},
    create: {
      email: 'shopper@otsy.local',
      password_hash: shopperUserPassword,
      phone: '+81-90-8765-4321',
      role: 'shopper',
    },
  });

  // Create test shopper profile
  const shopper = await prisma.shopper.upsert({
    where: { email: 'shopper@otsy.local' },
    update: {},
    create: {
      user_id: shopperUser.id,
      email: 'shopper@otsy.local',
      password_hash: shopperUserPassword,
      phone: '+81-90-8765-4321',
      kyc_status: 'approved',
      risk_tier: 'L1',
      rating_avg: 4.5,
      rating_count: 10,
      status: 'active',
    },
  });

  // Create item categories
  const categories = [
    {
      name: '野菜・果物',
      description: '新鮮な野菜と果物',
      icon: '🥬',
      color: '#4CAF50',
      sort_order: 1,
    },
    {
      name: '肉・魚',
      description: '肉類と魚介類',
      icon: '🥩',
      color: '#FF5722',
      sort_order: 2,
    },
    {
      name: '乳製品・卵',
      description: '牛乳、チーズ、卵など',
      icon: '🥛',
      color: '#FFC107',
      sort_order: 3,
    },
    {
      name: 'パン・麺類',
      description: 'パン、麺類、米類',
      icon: '🍞',
      color: '#FF9800',
      sort_order: 4,
    },
    {
      name: '調味料・調理用品',
      description: '調味料、油、調理器具',
      icon: '🧂',
      color: '#9C27B0',
      sort_order: 5,
    },
    {
      name: '飲み物',
      description: 'ジュース、お茶、コーヒーなど',
      icon: '🥤',
      color: '#2196F3',
      sort_order: 6,
    },
    {
      name: 'お菓子・スイーツ',
      description: 'チョコレート、ケーキ、アイスなど',
      icon: '🍰',
      color: '#E91E63',
      sort_order: 7,
    },
    {
      name: '日用品',
      description: 'トイレットペーパー、洗剤など',
      icon: '🧻',
      color: '#607D8B',
      sort_order: 8,
    },
  ];

  const createdCategories = [];
  for (const categoryData of categories) {
    const category = await prisma.itemCategory.upsert({
      where: { name: categoryData.name },
      update: {},
      create: categoryData,
    });
    createdCategories.push(category);
  }

  // Create items for each category
  const itemsData = [
    // 野菜・果物
    {
      category_name: '野菜・果物',
      items: [
        { name: 'キャベツ', price_min: 150, price_max: 300, unit: '個' },
        { name: 'にんじん', price_min: 100, price_max: 200, unit: '袋' },
        { name: '玉ねぎ', price_min: 80, price_max: 150, unit: '袋' },
        { name: 'じゃがいも', price_min: 120, price_max: 250, unit: '袋' },
        { name: 'トマト', price_min: 200, price_max: 400, unit: 'パック' },
        { name: 'きゅうり', price_min: 100, price_max: 200, unit: '本' },
        { name: 'レタス', price_min: 120, price_max: 250, unit: '個' },
        { name: 'バナナ', price_min: 150, price_max: 300, unit: '房' },
        { name: 'りんご', price_min: 200, price_max: 400, unit: '袋' },
        { name: 'みかん', price_min: 300, price_max: 600, unit: '袋' },
      ],
    },
    // 肉・魚
    {
      category_name: '肉・魚',
      items: [
        { name: '豚肉（ロース）', price_min: 300, price_max: 600, unit: '100g' },
        { name: '牛肉（もも）', price_min: 400, price_max: 800, unit: '100g' },
        { name: '鶏もも肉', price_min: 200, price_max: 400, unit: '100g' },
        { name: '鮭', price_min: 300, price_max: 600, unit: '1切れ' },
        { name: 'マグロ', price_min: 400, price_max: 800, unit: '100g' },
        { name: 'エビ', price_min: 500, price_max: 1000, unit: '100g' },
        { name: 'ハム', price_min: 200, price_max: 400, unit: 'パック' },
        { name: 'ソーセージ', price_min: 300, price_max: 600, unit: 'パック' },
      ],
    },
    // 乳製品・卵
    {
      category_name: '乳製品・卵',
      items: [
        { name: '牛乳', price_min: 150, price_max: 250, unit: '1L' },
        { name: '卵', price_min: 200, price_max: 400, unit: '10個パック' },
        { name: 'チーズ', price_min: 300, price_max: 600, unit: 'パック' },
        { name: 'ヨーグルト', price_min: 100, price_max: 200, unit: '4個パック' },
        { name: 'バター', price_min: 200, price_max: 400, unit: '200g' },
        { name: 'マーガリン', price_min: 150, price_max: 300, unit: '400g' },
      ],
    },
    // パン・麺類
    {
      category_name: 'パン・麺類',
      items: [
        { name: '食パン', price_min: 100, price_max: 200, unit: '1斤' },
        { name: 'うどん', price_min: 150, price_max: 300, unit: '3玉パック' },
        { name: 'そば', price_min: 200, price_max: 400, unit: '3玉パック' },
        { name: 'パスタ', price_min: 100, price_max: 200, unit: '500g' },
        { name: '米', price_min: 2000, price_max: 4000, unit: '5kg' },
        { name: '冷凍うどん', price_min: 200, price_max: 400, unit: 'パック' },
      ],
    },
    // 調味料・調理用品
    {
      category_name: '調味料・調理用品',
      items: [
        { name: '醤油', price_min: 200, price_max: 500, unit: '500ml' },
        { name: '味噌', price_min: 300, price_max: 600, unit: '500g' },
        { name: 'サラダ油', price_min: 200, price_max: 400, unit: '900ml' },
        { name: '塩', price_min: 100, price_max: 200, unit: '500g' },
        { name: '砂糖', price_min: 150, price_max: 300, unit: '1kg' },
        { name: '酢', price_min: 150, price_max: 300, unit: '500ml' },
      ],
    },
    // 飲み物
    {
      category_name: '飲み物',
      items: [
        { name: 'コーラ', price_min: 100, price_max: 200, unit: '500ml' },
        { name: 'オレンジジュース', price_min: 150, price_max: 300, unit: '1L' },
        { name: '緑茶', price_min: 100, price_max: 200, unit: '500ml' },
        { name: 'コーヒー', price_min: 200, price_max: 400, unit: '200g' },
        { name: 'ビール', price_min: 200, price_max: 400, unit: '350ml' },
        { name: '水', price_min: 100, price_max: 200, unit: '2L' },
      ],
    },
    // お菓子・スイーツ
    {
      category_name: 'お菓子・スイーツ',
      items: [
        { name: 'チョコレート', price_min: 100, price_max: 300, unit: '個' },
        { name: 'クッキー', price_min: 200, price_max: 400, unit: '袋' },
        { name: 'アイスクリーム', price_min: 200, price_max: 500, unit: '個' },
        { name: 'ケーキ', price_min: 500, price_max: 1500, unit: '個' },
        { name: 'ポテトチップス', price_min: 150, price_max: 300, unit: '袋' },
      ],
    },
    // 日用品
    {
      category_name: '日用品',
      items: [
        { name: 'トイレットペーパー', price_min: 300, price_max: 600, unit: '12ロール' },
        { name: '洗剤', price_min: 200, price_max: 400, unit: '1L' },
        { name: '歯磨き粉', price_min: 150, price_max: 300, unit: '本' },
        { name: 'シャンプー', price_min: 300, price_max: 600, unit: '本' },
        { name: 'ティッシュペーパー', price_min: 100, price_max: 200, unit: '箱' },
      ],
    },
  ];

  for (const categoryData of itemsData) {
    const category = createdCategories.find(c => c.name === categoryData.category_name);
    if (category) {
      for (const itemData of categoryData.items) {
        await prisma.item.upsert({
          where: { 
            name_category: {
              name: itemData.name,
              category_id: category.id,
            }
          },
          update: {},
          create: {
            category_id: category.id,
            name: itemData.name,
            price_min: itemData.price_min,
            price_max: itemData.price_max,
            unit: itemData.unit,
            sort_order: 0,
          },
        });
      }
    }
  }

  console.log('✅ Seeding completed');
  console.log('📧 Admin:', admin.email);
  console.log('📧 User:', user.email);
  console.log('📧 Shopper:', shopper.email);
  console.log('📦 Categories created:', createdCategories.length);
  console.log('🛒 Items created:', itemsData.reduce((total, cat) => total + cat.items.length, 0));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
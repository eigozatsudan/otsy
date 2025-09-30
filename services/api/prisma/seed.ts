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

  // Create test users for pivot model
  const user1Password = await bcrypt.hash('user123', 10);
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@otsy.local' },
    update: {},
    create: {
      email: 'user1@otsy.local',
      password_hash: user1Password,
      display_name: '田中太郎',
    },
  });

  const user2Password = await bcrypt.hash('user456', 10);
  const user2 = await prisma.user.upsert({
    where: { email: 'user2@otsy.local' },
    update: {},
    create: {
      email: 'user2@otsy.local',
      password_hash: user2Password,
      display_name: '佐藤花子',
    },
  });

  const user3Password = await bcrypt.hash('user789', 10);
  const user3 = await prisma.user.upsert({
    where: { email: 'user3@otsy.local' },
    update: {},
    create: {
      email: 'user3@otsy.local',
      password_hash: user3Password,
      display_name: '山田次郎',
    },
  });

  // Create test groups
  const familyGroup = await prisma.group.create({
    data: {
      name: '田中家',
      description: '家族の買い物リスト',
      invite_code: 'FAMILY123456',
      created_by: user1.id,
    },
  });

  const friendsGroup = await prisma.group.create({
    data: {
      name: 'BBQ準備',
      description: '来週のBBQの買い出し',
      invite_code: 'BBQ789PARTY',
      created_by: user2.id,
    },
  });

  // Add users to groups
  await prisma.groupMember.createMany({
    data: [
      // Family group
      {
        user_id: user1.id,
        group_id: familyGroup.id,
        role: 'owner',
      },
      {
        user_id: user2.id,
        group_id: familyGroup.id,
        role: 'member',
      },
      // Friends group
      {
        user_id: user2.id,
        group_id: friendsGroup.id,
        role: 'owner',
      },
      {
        user_id: user3.id,
        group_id: friendsGroup.id,
        role: 'member',
      },
    ],
  });

  // Create some sample items for the family group
  const familyItems = await prisma.item.createMany({
    data: [
      {
        group_id: familyGroup.id,
        name: '牛乳',
        category: '乳製品・卵',
        quantity: '1L',
        note: '低脂肪がいいです',
        status: 'todo',
        created_by: user1.id,
      },
      {
        group_id: familyGroup.id,
        name: 'パン',
        category: 'パン・麺類',
        quantity: '1斤',
        status: 'todo',
        created_by: user2.id,
      },
      {
        group_id: familyGroup.id,
        name: 'トマト',
        category: '野菜・果物',
        quantity: '3個',
        status: 'purchased',
        created_by: user1.id,
      },
    ],
  });

  // Create some sample items for the friends group
  const friendsItems = await prisma.item.createMany({
    data: [
      {
        group_id: friendsGroup.id,
        name: '牛肉',
        category: '肉・魚',
        quantity: '2kg',
        note: 'カルビがいいかな',
        status: 'todo',
        created_by: user2.id,
      },
      {
        group_id: friendsGroup.id,
        name: 'ビール',
        category: '飲み物',
        quantity: '24本',
        status: 'todo',
        created_by: user3.id,
      },
      {
        group_id: friendsGroup.id,
        name: '炭',
        category: '日用品',
        quantity: '1袋',
        status: 'purchased',
        created_by: user2.id,
      },
    ],
  });

  // Create some sample messages for group communication
  await prisma.message.createMany({
    data: [
      {
        group_id: familyGroup.id,
        author_id: user1.id,
        body: '今日の夕食の材料を追加しました！',
      },
      {
        group_id: familyGroup.id,
        author_id: user2.id,
        body: 'パンも必要ですね。追加しておきます。',
      },
      {
        group_id: friendsGroup.id,
        author_id: user2.id,
        body: 'BBQの準備リスト作りました！',
      },
      {
        group_id: friendsGroup.id,
        author_id: user3.id,
        body: 'ビールは多めに買っておきましょう 🍺',
      },
    ],
  });

  console.log('✅ Seeding completed');
  console.log('📧 Admin:', admin.email);
  console.log('📧 User 1:', user1.email, '(' + user1.display_name + ')');
  console.log('📧 User 2:', user2.email, '(' + user2.display_name + ')');
  console.log('📧 User 3:', user3.email, '(' + user3.display_name + ')');
  console.log('👥 Family Group:', familyGroup.name, '(Code: ' + familyGroup.invite_code + ')');
  console.log('👥 Friends Group:', friendsGroup.name, '(Code: ' + friendsGroup.invite_code + ')');
  console.log('🛒 Sample items and messages created for testing');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
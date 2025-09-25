import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@otsukai.local' },
    update: {},
    create: {
      email: 'admin@otsukai.local',
      password_hash: adminPassword,
      role: 'manager',
    },
  });

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@otsukai.local' },
    update: {},
    create: {
      email: 'user@otsukai.local',
      password_hash: userPassword,
      phone: '+81-90-1234-5678',
      subscription_tier: 'basic',
    },
  });

  // Create test shopper
  const shopperPassword = await bcrypt.hash('shopper123', 10);
  const shopper = await prisma.shopper.upsert({
    where: { email: 'shopper@otsukai.local' },
    update: {},
    create: {
      email: 'shopper@otsukai.local',
      password_hash: shopperPassword,
      phone: '+81-90-8765-4321',
      kyc_status: 'approved',
      risk_tier: 'L1',
      rating_avg: 4.5,
      rating_count: 10,
      status: 'active',
    },
  });

  console.log('✅ Seeding completed');
  console.log('📧 Admin:', admin.email);
  console.log('📧 User:', user.email);
  console.log('📧 Shopper:', shopper.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';

// Setup driver adapter for Prisma 7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // Clean existing entries
  await prisma.user.deleteMany();

  // Create test user
  const hashedPassword = await argon2.hash('Password123!');
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      role: 'ADMIN',
    },
  });

  console.log('Seeded entries:', { testUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


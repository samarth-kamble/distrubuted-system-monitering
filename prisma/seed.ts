import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Setup driver adapter for Prisma 7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // Clean existing entries
  await prisma.demo.deleteMany();

  const d1 = await prisma.demo.create({
    data: {
      name: 'First Demo Entry',
    },
  });

  const d2 = await prisma.demo.create({
    data: {
      name: 'Second Demo Entry',
    },
  });

  console.log('Seeded entries:', { d1, d2 });
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

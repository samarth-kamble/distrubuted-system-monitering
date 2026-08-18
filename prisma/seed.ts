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
  await prisma.tenant.deleteMany();

  // Create default tenant
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: 'Acme Corporation',
      bio: 'Leading manufacturing and services distribution organization.',
    },
  });

  // Create test admin user linked to the tenant
  const hashedPassword = await argon2.hash('Password123!');
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
      role: 'ADMIN',
      tenantId: defaultTenant.id,
    },
  });

  // Create default Super Admin user
  const superPassword = await argon2.hash('SuperPassword123!');
  const superUser = await prisma.user.create({
    data: {
      email: 'super@pulseguard.com',
      passwordHash: superPassword,
      name: 'Platform Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Seeded entries:', { defaultTenant, testUser, superUser });
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


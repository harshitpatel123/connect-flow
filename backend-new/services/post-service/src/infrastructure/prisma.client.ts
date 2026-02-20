import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

prisma.$connect()
  .then(() => console.log('✅ Database connected'))
  .catch((err : any) => console.error('❌ Database connection failed:', err));

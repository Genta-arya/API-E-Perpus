import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === 'production') {
  // In production, reuse the existing prisma instance
  prisma = prisma || new PrismaClient();
} else {
  // In development, always create a new prisma instance
  prisma = new PrismaClient();
}

export default prisma;

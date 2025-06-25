// Create a new file named 'update-password.ts'

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash the new password
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Update the user's password
  const updatedUser = await prisma.user.update({
    where: {
      email: 'Carol_Grady-Macejkovic@yahoo.com',
    },
    data: {
      password: hashedPassword,
    },
  });
  }

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
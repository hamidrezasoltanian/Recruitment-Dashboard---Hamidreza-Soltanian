const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const candidates = await prisma.candidate.findMany({
    select: {
      id: true,
      name: true,
      interviewDate: true,
      interviewTime: true,
      stage: true
    }
  });
  console.log(JSON.stringify(candidates, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tech = await prisma.technology.create({
    data: {
      techId: "T-AUTO",
      technologyName: "Automation Test",
      inventorName: "Dr. Test",
      reviewerName: "Reviewer",
      domainAssetClass: "Digital",
    },
    select: {
      id: true,
      rowVersion: true,
      createdAt: true,
    },
  });

  console.log(JSON.stringify(tech, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

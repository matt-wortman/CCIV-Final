import { PrismaClient, TechStage } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tech = await prisma.technology.findFirst({ select: { id: true } });
  if (!tech) {
    console.error("No technology found to create audit record for");
    process.exit(1);
  }

  const audit = await prisma.technologyAuditLog.create({
    data: {
      technologyId: tech.id,
      fieldPath: "technology.inventorName",
      oldValue: "Dr. Old",
      newValue: "Dr. Updated",
      stage: TechStage.TRIAGE,
      persona: "tech_manager",
      changedBy: "manager@example.com",
    },
    select: { id: true, changedAt: true },
  });

  console.log(JSON.stringify(audit, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'technologies','triage_stages','viability_stages','stage_history','technology_audit_log',
        'attachments','calculated_metrics','question_dictionary','personas','users','user_personas',
        'triage_competitors','triage_smes'
      )
    ORDER BY tablename;
  `;

  console.log(rows.map((row) => row.tablename).join("\n"));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

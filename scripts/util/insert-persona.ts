import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const persona = await prisma.persona.upsert({
    where: { code: "tech_manager" },
    update: {},
    create: {
      code: "tech_manager",
      label: "Tech Manager",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      name: "Manager",
    },
  });

  await prisma.userPersona.upsert({
    where: {
      userId_personaId: {
        userId: user.id,
        personaId: persona.id,
      },
    },
    update: {
      primary: true,
    },
    create: {
      userId: user.id,
      personaId: persona.id,
      primary: true,
    },
  });

  console.log(JSON.stringify({ persona, user }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

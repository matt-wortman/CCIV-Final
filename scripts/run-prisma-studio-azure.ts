import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const candidateEnvFiles = ['.env.azurestudio.local', '.env.azure.local', '.env.azure'];

let loadedEnvFile: string | undefined;

for (const file of candidateEnvFiles) {
  const absolutePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(absolutePath)) {
    const result = config({ path: absolutePath });
    if (result.error) {
      console.warn(`Failed to load ${file}:`, result.error);
    } else {
      loadedEnvFile = file;
      break;
    }
  }
}

if (!loadedEnvFile) {
  console.warn('No .env.azure(.local) file found. Falling back to existing environment variables.');
}

const azureDatabaseUrl =
  process.env.AZURE_DATABASE_URL ??
  process.env.DATABASE_URL_AZURE ??
  process.env.DATABASE_URL;

if (!azureDatabaseUrl) {
  console.error(
    [
      'Unable to start Prisma Studio for Azure.',
      'Provide a connection string via one of the following:',
      '  - AZURE_DATABASE_URL=postgresql://... (preferred)',
      '  - DATABASE_URL_AZURE=postgresql://...',
      '  - DATABASE_URL=postgresql://... (only if it points to Azure)',
      'You can store the value in .env.azure or .env.azure.local.',
    ].join('\n'),
  );
  process.exit(1);
}

const child = spawn(
  'npx',
  ['prisma', 'studio', '--schema', 'prisma/schema.prisma'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: azureDatabaseUrl,
    },
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to launch Prisma Studio for Azure:', error);
  process.exit(1);
});

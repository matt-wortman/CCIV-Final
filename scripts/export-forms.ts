#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { loadExportConfig } from './export/config';
import { deliverWorkbook } from './export/destination';
import { fetchSubmissions } from './export/data-fetcher';
import { buildWorkbook } from './export/workbook-builder';

const prisma = new PrismaClient();

const summarize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(',');
  }
  return `${value}`;
};

const run = async (): Promise<void> => {
  const config = loadExportConfig();
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'export.start',
      destination: config.destination,
      timezone: config.timezone,
      filename: config.filename,
      statuses: summarize(config.filters.statuses),
      startDate: config.filters.startDate?.toISOString() ?? null,
      endDate: config.filters.endDate?.toISOString() ?? null,
      templateIds: config.filters.templateIds ?? null,
    }),
  );

  const submissions = await fetchSubmissions(prisma, config.filters);

  console.log(
    JSON.stringify({
      level: 'info',
      event: 'export.dataLoaded',
      submissionCount: submissions.length,
    }),
  );

  const workbook = buildWorkbook(submissions, { timezone: config.timezone });
  const result = await deliverWorkbook(workbook, config);

  console.log(
    JSON.stringify({
      level: 'info',
      event: 'export.completed',
      destination: result.destination,
      location: result.location,
      bytesWritten: result.bytesWritten,
      filename: result.filename,
      submissionCount: submissions.length,
    }),
  );
};

run()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'export.failed',
        message,
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

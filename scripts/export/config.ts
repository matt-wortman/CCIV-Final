import { SubmissionStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { z } from 'zod';
import {
  BlobDestinationConfig,
  ExportConfig,
  ExportDestinationType,
  ExportFilters,
} from './types';

type RawArgs = Record<string, string | boolean>;

const DEFAULT_TIMEZONE = 'America/New_York';
const DEFAULT_DESTINATION: ExportDestinationType = 'blob';
const DEFAULT_OUTPUT_DIR = 'exports';
const STATUS_DELIMITER = /[,|]/;

const destinationSchema = z.enum(['blob', 'local']);

const statusSchema = z.nativeEnum(SubmissionStatus);

const parseArgs = (argv: string[]): RawArgs => {
  const result: RawArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      continue;
    }

    const trimmed = arg.slice(2);
    if (trimmed.startsWith('no-')) {
      result[trimmed.slice(3)] = false;
      continue;
    }

    const [key, inlineValue] = trimmed.split('=', 2);
    if (inlineValue !== undefined) {
      result[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      result[key] = next;
      index += 1;
    } else {
      result[key] = true;
    }
  }

  return result;
};

const parseStatuses = (rawStatuses: string | undefined): SubmissionStatus[] => {
  if (!rawStatuses || rawStatuses.trim().length === 0) {
    return [SubmissionStatus.DRAFT, SubmissionStatus.SUBMITTED];
  }

  const statuses = rawStatuses
    .split(STATUS_DELIMITER)
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length > 0);

  if (statuses.length === 0) {
    throw new Error('At least one submission status must be specified when using --status.');
  }

  return statuses.map((value) => {
    const parseResult = statusSchema.safeParse(value);
    if (!parseResult.success) {
      throw new Error(`Invalid submission status: ${value}`);
    }
    return parseResult.data;
  });
};

const parseDate = (input: string | undefined, label: string, timezone: string): Date | undefined => {
  if (!input) {
    return undefined;
  }

  const candidate = DateTime.fromISO(input, { zone: timezone });
  if (!candidate.isValid) {
    throw new Error(`Invalid ${label} (${input}). Use ISO format (e.g., 2025-10-01 or 2025-10-01T00:00).`);
  }

  return candidate.toJSDate();
};

const buildBlobConfig = (source: {
  container?: string;
  connectionString?: string;
  sasUrl?: string;
}): BlobDestinationConfig => {
  const container = source.container;
  if (!container) {
    throw new Error('Blob destination requires a container name (set EXPORT_BLOB_CONTAINER or pass --blob-container).');
  }

  const connectionString = source.connectionString;
  const sasUrl = source.sasUrl;

  if (!connectionString && !sasUrl) {
    throw new Error(
      'Blob destination requires authentication. Provide AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_BLOB_SAS_URL / --blob-sas-url.',
    );
  }

  return {
    container,
    connectionString,
    sasUrl,
  };
};

export const loadExportConfig = (argv: string[] = process.argv.slice(2)): ExportConfig => {
  const args = parseArgs(argv);
  const env = process.env;

  const destinationInput = (args.destination as string | undefined) ?? env.EXPORT_DESTINATION ?? DEFAULT_DESTINATION;
  const destination = destinationSchema.parse(destinationInput);

  const timezone = (args.timezone as string | undefined) ?? env.EXPORT_TIMEZONE ?? DEFAULT_TIMEZONE;
  const timezoneCheck = DateTime.now().setZone(timezone);
  if (!timezoneCheck.isValid) {
    throw new Error(`Invalid timezone "${timezone}". Use an IANA identifier such as America/New_York.`);
  }

  const statuses = parseStatuses((args.status as string | undefined) ?? env.EXPORT_STATUSES);
  const templateIdsRaw = (args.template as string | undefined) ?? env.EXPORT_TEMPLATE_IDS;
  const templateIds = templateIdsRaw
    ? templateIdsRaw
        .split(STATUS_DELIMITER)
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;

  const filters: ExportFilters = {
    statuses,
    templateIds,
    startDate: parseDate((args['start-date'] as string | undefined) ?? env.EXPORT_START_DATE, 'start date', timezone),
    endDate: parseDate((args['end-date'] as string | undefined) ?? env.EXPORT_END_DATE, 'end date', timezone),
  };

  const now = DateTime.now().setZone(timezone);
  const filename = `triage-forms-${now.toFormat('yyyyLLdd-HHmm')}.xlsx`;

  const outputDir =
    (args['output-dir'] as string | undefined) ?? env.EXPORT_OUTPUT_DIR ?? (destination === 'local' ? DEFAULT_OUTPUT_DIR : undefined);

  let blobConfig: BlobDestinationConfig | undefined;
  if (destination === 'blob') {
    blobConfig = buildBlobConfig({
      container: (args['blob-container'] as string | undefined) ?? env.EXPORT_BLOB_CONTAINER,
      connectionString: (args['connection-string'] as string | undefined) ?? env.AZURE_STORAGE_CONNECTION_STRING,
      sasUrl: (args['blob-sas-url'] as string | undefined) ?? env.AZURE_STORAGE_BLOB_SAS_URL,
    });
  }

  return {
    destination,
    timezone,
    filename,
    filters,
    outputDir,
    blob: blobConfig,
  };
};

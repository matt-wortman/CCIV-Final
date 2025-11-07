import { SubmissionStatus } from '@prisma/client';

export type ExportDestinationType = 'blob' | 'local';

export interface ExportFilters {
  statuses: SubmissionStatus[];
  startDate?: Date;
  endDate?: Date;
  templateIds?: string[];
}

export interface BlobDestinationConfig {
  container: string;
  connectionString?: string;
  sasUrl?: string;
}

export interface ExportConfig {
  destination: ExportDestinationType;
  timezone: string;
  filename: string;
  filters: ExportFilters;
  outputDir?: string;
  blob?: BlobDestinationConfig;
}

export interface ExportContext {
  submissionCount: number;
}

export interface ExportResult {
  destination: ExportDestinationType;
  location: string;
  bytesWritten: number;
  filename: string;
}

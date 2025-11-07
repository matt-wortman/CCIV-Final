import { FieldType, Prisma, QuestionResponse, RepeatableGroupResponse } from '@prisma/client';
import ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import { SubmissionWithRelations } from './data-fetcher';

type Worksheet = ExcelJS.Worksheet;

interface WorkbookOptions {
  timezone: string;
}

const sanitizeSheetName = (templateName: string, submissionId: string): string => {
  const shortId = submissionId.slice(0, 8);
  const rawName = `${templateName}-${shortId}`.replace(/[\[\]\*\/\\\?:]/g, ' ');
  return rawName.length <= 31 ? rawName : rawName.slice(0, 31);
};

const makeUniqueSheetName = (workbook: ExcelJS.Workbook, baseName: string): string => {
  if (!workbook.getWorksheet(baseName)) {
    return baseName;
  }

  let attempt = 1;
  while (attempt < 1000) {
    const suffix = `-${attempt}`;
    const truncatedBase = baseName.length + suffix.length > 31 ? baseName.slice(0, 31 - suffix.length) : baseName;
    const candidate = `${truncatedBase}${suffix}`;
    if (!workbook.getWorksheet(candidate)) {
      return candidate;
    }
    attempt += 1;
  }

  throw new Error(`Unable to create a unique worksheet name for base "${baseName}".`);
};

const formatDate = (date: Date | null | undefined, timezone: string): string => {
  if (!date) {
    return '';
  }
  return DateTime.fromJSDate(date).setZone(timezone).toFormat('yyyy-LL-dd HH:mm z');
};

const isJsonObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const formatScalar = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};

const formatArray = (values: unknown[]): string => {
  return values
    .map((entry) => {
      if (Array.isArray(entry)) {
        return `[${formatArray(entry)}]`;
      }
      return formatScalar(entry);
    })
    .filter((entry) => entry.length > 0)
    .join(', ');
};

const formatResponseValue = (
  question: SubmissionWithRelations['template']['sections'][number]['questions'][number],
  value: Prisma.JsonValue,
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const optionLookup =
    question.options && question.options.length > 0
      ? new Map(question.options.map((option) => [option.value, option.label]))
      : undefined;

  if (Array.isArray(value)) {
    const values = value.map((entry) => {
      if (optionLookup && typeof entry === 'string') {
        return optionLookup.get(entry) ?? entry;
      }
      return entry;
    });
    return formatArray(values);
  }

  if (typeof value === 'string' && optionLookup) {
    return optionLookup.get(value) ?? value;
  }

  if (isJsonObject(value)) {
    return JSON.stringify(value);
  }

  return formatScalar(value);
};

const parseRepeatableColumns = (
  question: SubmissionWithRelations['template']['sections'][number]['questions'][number],
  rows: RepeatableGroupResponse[],
): { key: string; label: string }[] => {
  const config = question.repeatableConfig;
  if (config && isJsonObject(config)) {
    const columns = (config as { columns?: unknown }).columns;
    if (Array.isArray(columns)) {
      return columns
        .map((column) => {
          if (isJsonObject(column) && typeof column.key === 'string') {
            return {
              key: column.key,
              label: typeof column.label === 'string' ? column.label : column.key,
            };
          }
          if (isJsonObject(column) && typeof column.field === 'string') {
            // Some configs may use "field" instead of "key"
            return {
              key: column.field,
              label: typeof column.label === 'string' ? column.label : column.field,
            };
          }
          return undefined;
        })
        .filter((column): column is { key: string; label: string } => Boolean(column));
    }
  }

  if (rows.length > 0) {
    const firstRow = rows[0].data;
    if (isJsonObject(firstRow)) {
      return Object.keys(firstRow).map((key) => ({ key, label: key }));
    }
  }

  return [];
};

const addMetadataBlock = (worksheet: Worksheet, submission: SubmissionWithRelations, timezone: string): void => {
  const metadataRows: Array<[string, string]> = [
    ['Submission ID', submission.id],
    ['Template', submission.template.name],
    ['Template Version', submission.template.version ?? ''],
    ['Status', submission.status],
    ['Submitted By', submission.submittedBy],
    ['Created At', formatDate(submission.createdAt, timezone)],
    ['Updated At', formatDate(submission.updatedAt, timezone)],
    ['Submitted At', formatDate(submission.submittedAt ?? null, timezone)],
  ];

  metadataRows.forEach(([label, value]) => {
    const row = worksheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
  });

  worksheet.addRow([]);
};

const addSectionHeader = (worksheet: Worksheet, title: string): void => {
  const row = worksheet.addRow([title]);
  row.font = { bold: true, size: 12 };
};

const addQuestionRow = (
  worksheet: Worksheet,
  question: SubmissionWithRelations['template']['sections'][number]['questions'][number],
  response: QuestionResponse | undefined,
): void => {
  const value = response ? formatResponseValue(question, response.value) : '';
  const row = worksheet.addRow(['', question.fieldCode, question.label, value]);
  row.getCell(2).font = { bold: true };
  row.getCell(4).alignment = { wrapText: true };
};

const addRepeatableGroup = (
  worksheet: Worksheet,
  question: SubmissionWithRelations['template']['sections'][number]['questions'][number],
  groupResponses: RepeatableGroupResponse[],
): void => {
  const headerRow = worksheet.addRow(['', question.fieldCode, question.label, '']);
  headerRow.getCell(2).font = { bold: true };
  headerRow.getCell(3).font = { bold: true };

  if (groupResponses.length === 0) {
    const emptyRow = worksheet.addRow(['', '', 'No entries', '']);
    emptyRow.getCell(3).font = { italic: true };
    return;
  }

  const columns = parseRepeatableColumns(question, groupResponses);

  groupResponses.forEach((entry, index) => {
    const baseLabel = `Row ${index + 1}`;
    if (columns.length === 0) {
      const row = worksheet.addRow(['', '', baseLabel, formatScalar(entry.data)]);
      row.getCell(4).alignment = { wrapText: true };
      return;
    }

    columns.forEach((column, columnIndex) => {
      const dataValue = isJsonObject(entry.data) ? entry.data[column.key] : undefined;
      const label = columnIndex === 0 ? baseLabel : '';
      const row = worksheet.addRow(['', '', `${label} ${column.label}`.trim(), formatScalar(dataValue)]);
      row.getCell(4).alignment = { wrapText: true };
    });
  });
};

const addScores = (worksheet: Worksheet, submission: SubmissionWithRelations): void => {
  if (!submission.scores || submission.scores.length === 0) {
    return;
  }

  worksheet.addRow([]);
  const headerRow = worksheet.addRow(['Scores']);
  headerRow.font = { bold: true };

  submission.scores.forEach((score) => {
    const row = worksheet.addRow(['', score.scoreType, '', score.value]);
    row.getCell(2).font = { bold: true };
  });
};

export const buildWorkbook = (submissions: SubmissionWithRelations[], options: WorkbookOptions): ExcelJS.Workbook => {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  workbook.creator = 'Tech Triage Export';

  if (submissions.length === 0) {
    const worksheet = workbook.addWorksheet('No Submissions');
    worksheet.addRow(['No submissions matched the provided filters.']);
    return workbook;
  }

  submissions.forEach((submission) => {
    const baseName = sanitizeSheetName(submission.template.name, submission.id);
    const sheetName = makeUniqueSheetName(workbook, baseName);
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.properties.defaultRowHeight = 18;
    worksheet.columns = [
      { key: 'section', width: 28 },
      { key: 'code', width: 18 },
      { key: 'question', width: 60 },
      { key: 'response', width: 60 },
    ];

    addMetadataBlock(worksheet, submission, options.timezone);

    const responseLookup = new Map(submission.responses.map((item) => [item.questionCode, item]));
    const repeatLookup = new Map<string, RepeatableGroupResponse[]>();
    submission.repeatGroups.forEach((entry) => {
      const existing = repeatLookup.get(entry.questionCode) ?? [];
      existing.push(entry);
      repeatLookup.set(entry.questionCode, existing);
    });

    submission.template.sections.forEach((section, sectionIndex) => {
      if (sectionIndex > 0) {
        worksheet.addRow([]);
      }
      addSectionHeader(worksheet, section.title);

      section.questions.forEach((question) => {
        if (question.type === FieldType.REPEATABLE_GROUP) {
          const groupResponses = repeatLookup.get(question.fieldCode) ?? [];
          addRepeatableGroup(worksheet, question, groupResponses);
          return;
        }
        const response = responseLookup.get(question.fieldCode);
        addQuestionRow(worksheet, question, response);
      });
    });

    addScores(worksheet, submission);
  });

  return workbook;
};

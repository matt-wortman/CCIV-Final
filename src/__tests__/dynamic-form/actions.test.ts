/**
 * @jest-environment node
 */
/* eslint-disable no-var */
import { saveDraftResponse, loadDraftResponse } from '@/app/dynamic-form/actions';
import type { Prisma } from '@prisma/client';
import { DataSource } from '@prisma/client';
import { OptimisticLockError } from '@/lib/technology/types';
import type { FormTemplateWithSections } from '@/lib/form-engine/types';

type PrismaMocks = {
  formSubmissionCreate: jest.Mock;
  formSubmissionFindFirst: jest.Mock;
  questionResponseCreateMany: jest.Mock;
  repeatableGroupCreateMany: jest.Mock;
  calculatedScoreCreateMany: jest.Mock;
};

var prismaMocks: PrismaMocks;
var mockApplyBindingWrites: jest.Mock;
var mockFetchTemplateWithBindingsById: jest.Mock;

jest.mock('@/lib/prisma', () => {
  prismaMocks = {
    formSubmissionCreate: jest.fn(),
    formSubmissionFindFirst: jest.fn(),
    questionResponseCreateMany: jest.fn(),
    repeatableGroupCreateMany: jest.fn(),
    calculatedScoreCreateMany: jest.fn(),
  };

  const baseClient = {
    formSubmission: {
      create: prismaMocks.formSubmissionCreate,
      findFirst: prismaMocks.formSubmissionFindFirst,
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    questionResponse: {
      createMany: prismaMocks.questionResponseCreateMany,
    },
    repeatableGroupResponse: {
      createMany: prismaMocks.repeatableGroupCreateMany,
    },
    calculatedScore: {
      createMany: prismaMocks.calculatedScoreCreateMany,
    },
  } as unknown as Prisma.TransactionClient;

  const transaction = async <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => fn(baseClient);

  return {
    prisma: {
      ...baseClient,
      $transaction: transaction,
    },
  };
});

jest.mock('@/lib/technology/service', () => {
  const actualModule = jest.requireActual('@/lib/technology/service');
  return {
    ...actualModule,
    fetchTemplateWithBindingsById: (...args: unknown[]) => {
      if (!mockFetchTemplateWithBindingsById) {
        mockFetchTemplateWithBindingsById = jest.fn();
      }
      return mockFetchTemplateWithBindingsById(...args);
    },
    applyBindingWrites: (...args: unknown[]) => {
      if (!mockApplyBindingWrites) {
        mockApplyBindingWrites = jest.fn();
      }
      return mockApplyBindingWrites(...args);
    },
  };
});

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const TEMPLATE_ID = 'template-1';
const DRAFT_ID = 'draft-1';

const bindingMetadata = {
  'F0.1': {
    fieldCode: 'F0.1',
    questionId: 'question-tech-id',
    dictionaryKey: 'tech.techId',
    bindingPath: 'technology.techId',
    dataSource: DataSource.TECHNOLOGY,
    currentRevisionId: 'rev-tech-id-1',
  },
  'F0.5': {
    fieldCode: 'F0.5',
    questionId: 'question-inventor-info',
    dictionaryKey: 'tech.inventorName',
    bindingPath: 'technology.inventorName',
    dataSource: DataSource.TECHNOLOGY,
    currentRevisionId: 'rev-inventor-1',
  },
} as const;

describe('dynamic form actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    if (prismaMocks) {
      Object.values(prismaMocks).forEach((mock) => mock.mockReset());
    }

    mockFetchTemplateWithBindingsById = jest.fn();
    mockApplyBindingWrites = jest.fn();

    mockFetchTemplateWithBindingsById.mockResolvedValue({
      template: { id: TEMPLATE_ID, sections: [] } as unknown as FormTemplateWithSections,
      bindingMetadata,
    });

    mockApplyBindingWrites.mockResolvedValue({
      techId: 'TECH-001',
      technologyId: 'tech-record-1',
      rowVersions: {
        technologyRowVersion: 2,
      },
    });

    prismaMocks.formSubmissionCreate.mockResolvedValue({ id: DRAFT_ID });
  });

  it('persists repeatable group rows when saving a new draft', async () => {
    const result = await saveDraftResponse(
      {
        templateId: TEMPLATE_ID,
        responses: {
          'F0.1': 'TECH-001',
        },
        repeatGroups: {
          'F0.5': [
            { name: 'Dr. Jane Smith', title: 'MD', department: 'Oncology', email: 'jane@example.org' },
          ],
        },
        rowVersions: {
          technologyRowVersion: 1,
        },
      },
      'test-user'
    );

    if (!result.success) {
      throw new Error(result.error ?? 'saveDraftResponse returned success=false');
    }

    expect(prismaMocks.questionResponseCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          questionCode: 'F0.1',
          value: 'TECH-001',
          questionRevisionId: 'rev-tech-id-1',
        }),
      ]),
    });

    expect(prismaMocks.repeatableGroupCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          questionCode: 'F0.5',
          rowIndex: 0,
          data: expect.objectContaining({ name: 'Dr. Jane Smith', department: 'Oncology' }),
          questionRevisionId: 'rev-inventor-1',
        }),
      ]),
    });

    expect(mockApplyBindingWrites).toHaveBeenCalledWith(
      expect.anything(),
      bindingMetadata,
      expect.objectContaining({
        'F0.1': 'TECH-001',
        'F0.5': expect.arrayContaining([
          expect.objectContaining({ name: 'Dr. Jane Smith', department: 'Oncology' }),
        ]),
      }),
      expect.objectContaining({
        userId: 'test-user',
        expectedVersions: { technologyRowVersion: 1 },
      })
    );

    expect(result.rowVersions).toEqual({ technologyRowVersion: 2 });
  });

  it('hydrats repeatable rows when loading a draft', async () => {
    prismaMocks.formSubmissionFindFirst.mockResolvedValue({
      id: DRAFT_ID,
      templateId: TEMPLATE_ID,
      status: 'DRAFT',
      responses: [
        { questionCode: 'F0.1', value: 'TECH-001' },
      ],
      repeatGroups: [
        {
          questionCode: 'F0.5',
          rowIndex: 0,
          data: { name: 'Dr. Jane Smith', department: 'Oncology' },
        },
        {
          questionCode: 'F0.5',
          rowIndex: 1,
          data: { name: 'Alex Jordan', department: 'Bioinformatics' },
        },
      ],
      scores: [],
    });

    const result = await loadDraftResponse(DRAFT_ID, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data?.responses['F0.1']).toBe('TECH-001');
    expect(result.data?.repeatGroups['F0.5']).toEqual([
      { name: 'Dr. Jane Smith', department: 'Oncology' },
      { name: 'Alex Jordan', department: 'Bioinformatics' },
    ]);
  });

  it('returns conflict when optimistic lock fails', async () => {
    mockApplyBindingWrites.mockRejectedValue(new OptimisticLockError());

    const result = await saveDraftResponse(
      {
        templateId: TEMPLATE_ID,
        responses: {
          'F0.1': 'TECH-002',
        },
        repeatGroups: { 'F0.5': [] },
        rowVersions: {
          technologyRowVersion: 1,
        },
      },
      'test-user'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('conflict');
  });
});

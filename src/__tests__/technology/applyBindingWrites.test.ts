/**
 * @jest-environment node
 */
import { DataSource } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { applyBindingWrites, BindingMetadata } from '@/lib/technology/service';

const buildBindingMetadata = (
  overrides: Partial<BindingMetadata> & Pick<BindingMetadata, 'bindingPath'>
): BindingMetadata => ({
  fieldCode: overrides.fieldCode ?? overrides.bindingPath,
  questionId: overrides.questionId ?? `${overrides.bindingPath}-question`,
  dictionaryKey: overrides.dictionaryKey ?? `${overrides.bindingPath}-key`,
  dataSource: overrides.dataSource ?? DataSource.TECHNOLOGY,
  bindingPath: overrides.bindingPath,
  currentRevisionId: overrides.currentRevisionId ?? `${overrides.bindingPath}-rev`,
  currentVersion: overrides.currentVersion ?? 1,
});

describe('applyBindingWrites', () => {
  const technologyFindUnique = jest.fn();
  const technologyUpdate = jest.fn();
  const technologyUpdateMany = jest.fn();
  const technologyCreate = jest.fn();
  const triageStageUpdate = jest.fn();
  const triageStageUpdateMany = jest.fn();
  const triageStageCreate = jest.fn();
  const triageStageFindUnique = jest.fn();
  const viabilityStageUpdate = jest.fn();
  const viabilityStageUpdateMany = jest.fn();
  const viabilityStageCreate = jest.fn();
  const viabilityStageFindUnique = jest.fn();

  const mockTx = {
    technology: {
      findUnique: technologyFindUnique,
      update: technologyUpdate,
      updateMany: technologyUpdateMany,
      create: technologyCreate,
    },
    triageStage: {
      update: triageStageUpdate,
      updateMany: triageStageUpdateMany,
      create: triageStageCreate,
      findUnique: triageStageFindUnique,
    },
    viabilityStage: {
      update: viabilityStageUpdate,
      updateMany: viabilityStageUpdateMany,
      create: viabilityStageCreate,
      findUnique: viabilityStageFindUnique,
    },
  } as unknown as Prisma.TransactionClient;

const baseBindings: Record<string, BindingMetadata> = {
  tech_id: buildBindingMetadata({
    fieldCode: 'tech_id',
    bindingPath: 'technology.techId',
  }),
  tech_name: buildBindingMetadata({
    fieldCode: 'tech_name',
    bindingPath: 'technology.technologyName',
  }),
  overview: buildBindingMetadata({
    fieldCode: 'overview',
    bindingPath: 'triageStage.technologyOverview',
    dataSource: DataSource.STAGE_SUPPLEMENT,
  }),
  mission_score: buildBindingMetadata({
    fieldCode: 'mission_score',
    bindingPath: 'triageStage.missionAlignmentScore',
    dataSource: DataSource.STAGE_SUPPLEMENT,
  }),
  inventor_name: buildBindingMetadata({
    fieldCode: 'inventor_name',
    bindingPath: 'technology.inventorName',
  }),
  reviewer_name: buildBindingMetadata({
    fieldCode: 'reviewer_name',
    bindingPath: 'technology.reviewerName',
  }),
  domain_asset_class: buildBindingMetadata({
    fieldCode: 'domain_asset_class',
    bindingPath: 'technology.domainAssetClass',
  }),
  feasibility: buildBindingMetadata({
    fieldCode: 'feasibility',
    bindingPath: 'viabilityStage.technicalFeasibility',
    dataSource: DataSource.STAGE_SUPPLEMENT,
  }),
};

  beforeEach(() => {
    jest.clearAllMocks();
    technologyUpdateMany.mockResolvedValue({ count: 1 });
    triageStageCreate.mockResolvedValue({ rowVersion: 1 });
    triageStageFindUnique.mockResolvedValue({ rowVersion: 2 });
    triageStageUpdateMany.mockResolvedValue({ count: 1 });
    viabilityStageCreate.mockResolvedValue({ rowVersion: 1 });
    viabilityStageFindUnique.mockResolvedValue({ rowVersion: 2 });
    viabilityStageUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('updates existing technology and triage stage fields', async () => {
    technologyFindUnique.mockResolvedValue({
      id: 'tech-1',
      techId: 'D25-0001',
      triageStage: { id: 'triage-1' },
      viabilityStage: null,
    });

    const responses = {
      tech_id: 'D25-0001',
      tech_name: 'Smart Patch',
      overview: 'Updated overview',
      mission_score: 3,
    };

    const result = await applyBindingWrites(mockTx, baseBindings, responses, {
      userId: 'tester',
    });

    expect(result).toMatchObject({ technologyId: 'tech-1', techId: 'D25-0001' });
    expect(technologyUpdate).toHaveBeenCalledWith({
      where: { id: 'tech-1' },
      data: expect.objectContaining({
        technologyName: 'Smart Patch',
        lastModifiedBy: 'tester',
        rowVersion: { increment: 1 },
      }),
    });
    expect(triageStageUpdate).toHaveBeenCalledWith({
      where: { id: 'triage-1' },
      data: expect.objectContaining({
        technologyOverview: 'Updated overview',
        missionAlignmentScore: 3,
        extendedData: expect.objectContaining({
          'triageStage.technologyOverview-key': expect.objectContaining({
            value: 'Updated overview',
            questionRevisionId: 'triageStage.technologyOverview-rev',
          }),
          'triageStage.missionAlignmentScore-key': expect.objectContaining({
            value: 3,
            questionRevisionId: 'triageStage.missionAlignmentScore-rev',
          }),
        }),
        rowVersion: { increment: 1 },
      }),
    });
    expect(triageStageCreate).not.toHaveBeenCalled();
  });

  it('creates a technology record when required fields are present', async () => {
    technologyFindUnique.mockResolvedValue(null);
    technologyCreate.mockResolvedValue({
      id: 'tech-2',
      techId: 'D25-0002',
      triageStage: null,
      viabilityStage: null,
    });

    const responses = {
      tech_id: 'D25-0002',
      tech_name: 'Glucose Monitor',
      overview: 'New tech overview',
      mission_score: 4,
      inventor_name: 'Dr. Jane Smith',
      reviewer_name: 'Alex Johnson',
      domain_asset_class: 'Digital Health',
    };

    const result = await applyBindingWrites(mockTx, baseBindings, responses, {
      userId: 'tester',
      allowCreateWhenIncomplete: true,
    });

    expect(result).toMatchObject({ technologyId: 'tech-2', techId: 'D25-0002' });
    expect(technologyCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        techId: 'D25-0002',
        technologyName: 'Glucose Monitor',
        lastModifiedBy: 'tester',
      }),
      include: expect.any(Object),
    });
    expect(triageStageCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        technology: { connect: { id: 'tech-2' } },
        technologyOverview: 'New tech overview',
      }),
    });
  });

  it('returns empty result when techId is missing', async () => {
    const responses = {
      tech_name: 'Missing ID',
      overview: 'No tech id provided',
    };

    const result = await applyBindingWrites(mockTx, baseBindings, responses, {});

    expect(result).toEqual({});
    expect(technologyFindUnique).not.toHaveBeenCalled();
  });

  it('skips create when allowCreateWhenIncomplete=false and required fields missing', async () => {
    technologyFindUnique.mockResolvedValue(null);

    const responses = {
      tech_id: 'D25-0003',
      overview: 'Incomplete create payload',
    };

    const result = await applyBindingWrites(mockTx, baseBindings, responses, {
      allowCreateWhenIncomplete: false,
    });

    expect(result).toEqual({});
    expect(technologyCreate).not.toHaveBeenCalled();
  });

  it('creates or updates viability stage values when provided', async () => {
    technologyFindUnique.mockResolvedValue({
      id: 'tech-4',
      techId: 'D25-0004',
      triageStage: null,
      viabilityStage: { id: 'viability-1' },
    });

    const responses = {
      tech_id: 'D25-0004',
      tech_name: 'Nano Sensor',
      feasibility: 'Feasible with further testing',
    };

    await applyBindingWrites(mockTx, baseBindings, responses, {
      userId: 'tester',
    });

    expect(viabilityStageUpdate).toHaveBeenCalledWith({
      where: { id: 'viability-1' },
      data: expect.objectContaining({
        technicalFeasibility: 'Feasible with further testing',
        extendedData: expect.objectContaining({
          'viabilityStage.technicalFeasibility-key': expect.objectContaining({
            value: 'Feasible with further testing',
            questionRevisionId: 'viabilityStage.technicalFeasibility-rev',
          }),
        }),
        rowVersion: { increment: 1 },
      }),
    });
    expect(viabilityStageCreate).not.toHaveBeenCalled();
  });

  it('throws when triage stage optimistic locking fails', async () => {
    technologyFindUnique.mockResolvedValue({
      id: 'tech-lock',
      techId: 'D25-0005',
      triageStage: { id: 'triage-lock', rowVersion: 1 },
      viabilityStage: null,
    });
    triageStageUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      applyBindingWrites(
        mockTx,
        baseBindings,
        {
          tech_id: 'D25-0005',
          overview: 'Attempted update',
        },
        {
          expectedVersions: { triageStageRowVersion: 99 },
        }
      )
    ).rejects.toThrow('Triage stage was modified by another user');
  });
});

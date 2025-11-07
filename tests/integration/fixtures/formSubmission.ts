import type { FormSubmissionData } from '@/app/dynamic-form/actions';
import type { BindingMetadata } from '@/lib/technology/service';

export type BindingLookup = ReturnType<typeof createBindingLookup>;

export interface BuildSubmissionOverrides {
  responses?: Record<string, unknown>;
  repeatGroups?: Record<string, Array<Record<string, unknown>>>;
  calculatedScores?: Record<string, unknown>;
  rowVersions?: FormSubmissionData['rowVersions'];
}

export function createBindingLookup(bindingMetadata: Record<string, BindingMetadata>) {
  const byPath = new Map<string, BindingMetadata>();

  Object.values(bindingMetadata).forEach((meta) => {
    if (meta.bindingPath) {
      byPath.set(meta.bindingPath, meta);
    }
  });

  return {
    fieldCodeFor(bindingPath: string) {
      const meta = byPath.get(bindingPath);
      if (!meta) {
        throw new Error(`Missing binding for ${bindingPath}`);
      }
      return meta.fieldCode;
    },
    metadataFor(bindingPath: string) {
      const meta = byPath.get(bindingPath);
      if (!meta) {
        throw new Error(`Missing binding for ${bindingPath}`);
      }
      return meta;
    },
  } as const;
}

export function buildSubmissionPayload(
  templateId: string,
  lookup: BindingLookup,
  techId: string,
  overrides: BuildSubmissionOverrides = {}
): FormSubmissionData {
  const baseResponses = buildBaseResponses(lookup, techId);
  const baseRepeatGroups = buildBaseRepeatGroups(lookup);

  return {
    templateId,
    responses: {
      ...baseResponses,
      ...(overrides.responses ?? {}),
    },
    repeatGroups: {
      ...baseRepeatGroups,
      ...(overrides.repeatGroups ?? {}),
    },
    calculatedScores: overrides.calculatedScores ?? {},
    rowVersions: overrides.rowVersions,
  };
}

function buildBaseResponses(lookup: BindingLookup, techId: string) {
  return {
    [lookup.fieldCodeFor('technology.techId')]: techId,
    [lookup.fieldCodeFor('technology.technologyName')]: 'Integration Harness Demo',
    [lookup.fieldCodeFor('technology.reviewerName')]: 'QA Reviewer',
    [lookup.fieldCodeFor('technology.domainAssetClass')]: 'Software',
    [lookup.fieldCodeFor('triageStage.technologyOverview')]: 'Integration scenario overview',
    [lookup.fieldCodeFor('triageStage.missionAlignmentText')]: 'Aligned with mission',
    [lookup.fieldCodeFor('triageStage.missionAlignmentScore')]: 3,
    [lookup.fieldCodeFor('triageStage.recommendation')]: 'REVIEW',
  } as Record<string, unknown>;
}

function buildBaseRepeatGroups(lookup: BindingLookup) {
  return {
    [lookup.fieldCodeFor('technology.inventorName')]: [
      {
        name: 'Dr. Integration',
        title: 'PI',
        department: 'Bioengineering',
        email: 'integration@example.org',
      },
    ],
  } as Record<string, Array<Record<string, unknown>>>;
}

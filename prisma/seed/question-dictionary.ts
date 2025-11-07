import { PrismaClient, DataSource } from "@prisma/client";

const entries = [
  {
    key: "tech.techId",
    label: "Technology ID",
    helpText: "Unique identifier for the technology record.",
    bindingPath: "technology.techId",
    dataSource: DataSource.TECHNOLOGY,
  },
  {
    key: "tech.technologyName",
    label: "Technology Name",
    helpText: "Official name or title used to refer to this technology.",
    bindingPath: "technology.technologyName",
    dataSource: DataSource.TECHNOLOGY,
  },
  {
    key: "tech.inventorName",
    label: "Inventor Name",
    helpText: "Primary inventor associated with this technology.",
    bindingPath: "technology.inventorName",
    dataSource: DataSource.TECHNOLOGY,
  },
  {
    key: "tech.inventorDept",
    label: "Inventor Department",
    helpText: "Department affiliation for the primary inventor.",
    bindingPath: "technology.inventorDept",
    dataSource: DataSource.TECHNOLOGY,
  },
  {
    key: "tech.reviewerName",
    label: "Reviewer",
    helpText: "Technology reviewer responsible for evaluation.",
    bindingPath: "technology.reviewerName",
    dataSource: DataSource.TECHNOLOGY,
  },
  {
    key: "tech.domainAssetClass",
    label: "Domain or Asset Class",
    helpText: "Primary domain classification for this technology.",
    bindingPath: "technology.domainAssetClass",
    dataSource: DataSource.TECHNOLOGY,
  },
  {
    key: "triage.technologyOverview",
    label: "Technology Overview",
    helpText: "Summary provided during triage stage.",
    bindingPath: "triageStage.technologyOverview",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.missionAlignmentText",
    label: "Mission Alignment Narrative",
    helpText: "Narrative describing mission alignment in triage.",
    bindingPath: "triageStage.missionAlignmentText",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.missionAlignmentScore",
    label: "Mission Alignment Score",
    helpText: "Numeric score representing mission alignment evaluation.",
    bindingPath: "triageStage.missionAlignmentScore",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.unmetNeedText",
    label: "Unmet Need Narrative",
    helpText: "Narrative describing unmet clinical or market need.",
    bindingPath: "triageStage.unmetNeedText",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.unmetNeedScore",
    label: "Unmet Need Score",
    helpText: "Numeric score for unmet need evaluation.",
    bindingPath: "triageStage.unmetNeedScore",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.stateOfArtText",
    label: "State of the Art Narrative",
    helpText: "Summary of current alternatives and state of the art.",
    bindingPath: "triageStage.stateOfArtText",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.stateOfArtScore",
    label: "State of the Art Score",
    helpText: "Numeric score assessing state of the art.",
    bindingPath: "triageStage.stateOfArtScore",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.marketOverview",
    label: "Market Overview",
    helpText: "Narrative describing market landscape and opportunity.",
    bindingPath: "triageStage.marketOverview",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.marketScore",
    label: "Market Score",
    helpText: "Numeric score representing market assessment.",
    bindingPath: "triageStage.marketScore",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.recommendation",
    label: "Triage Recommendation",
    helpText: "Overall recommendation resulting from triage evaluation.",
    bindingPath: "triageStage.recommendation",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "triage.recommendationNotes",
    label: "Recommendation Notes",
    helpText: "Supporting notes for the triage recommendation.",
    bindingPath: "triageStage.recommendationNotes",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
  {
    key: "viability.technicalFeasibility",
    label: "Technical Feasibility",
    helpText: "Assessment captured during viability stage.",
    bindingPath: "viabilityStage.technicalFeasibility",
    dataSource: DataSource.STAGE_SUPPLEMENT,
  },
];

export async function seedQuestionDictionary(prisma: PrismaClient) {
  for (const entry of entries) {
    await prisma.questionDictionary.upsert({
      where: { key: entry.key },
      update: {
        label: entry.label,
        helpText: entry.helpText,
        bindingPath: entry.bindingPath,
        dataSource: entry.dataSource,
      },
      create: {
        version: "1.0.0",
        key: entry.key,
        label: entry.label,
        helpText: entry.helpText,
        bindingPath: entry.bindingPath,
        dataSource: entry.dataSource,
      },
    });
  }
}

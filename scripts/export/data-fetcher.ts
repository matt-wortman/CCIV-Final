import { PrismaClient, Prisma, SubmissionStatus } from '@prisma/client';
import { ExportFilters } from './types';

export type SubmissionWithRelations = Prisma.FormSubmissionGetPayload<{
  include: {
    template: {
      include: {
        sections: {
          include: {
            questions: {
              include: {
                options: true;
                scoringConfig: true;
              };
            };
          };
        };
      };
    };
    responses: true;
    repeatGroups: true;
    scores: true;
  };
}>;

const buildWhereClause = (filters: ExportFilters): Prisma.FormSubmissionWhereInput => {
  const where: Prisma.FormSubmissionWhereInput = {
    status: { in: filters.statuses.length > 0 ? filters.statuses : [SubmissionStatus.DRAFT, SubmissionStatus.SUBMITTED] },
  };

  if (filters.templateIds && filters.templateIds.length > 0) {
    where.templateId = { in: filters.templateIds };
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  return where;
};

export const fetchSubmissions = async (
  prisma: PrismaClient,
  filters: ExportFilters,
): Promise<SubmissionWithRelations[]> => {
  const submissions = await prisma.formSubmission.findMany({
    where: buildWhereClause(filters),
    include: {
      template: {
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  options: true,
                  scoringConfig: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
      responses: true,
      repeatGroups: {
        orderBy: {
          rowIndex: 'asc',
        },
      },
      scores: true,
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' },
    ],
  });

  return submissions;
};

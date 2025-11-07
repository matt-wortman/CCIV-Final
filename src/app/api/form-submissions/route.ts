import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus, Prisma } from '@prisma/client';
import {
  formSubmissionRequestSchema,
  formSubmissionUpdateSchema,
} from '@/lib/validation/form-submission';

const isDev = process.env.NODE_ENV !== 'production';

function buildScoreEntries(
  submissionId: string,
  calculatedScores: Record<string, Prisma.JsonValue> | undefined
) {
  if (!calculatedScores) {
    return [];
  }

  return Object.entries(calculatedScores)
    .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
    .map(([scoreType, value]) => ({
      submissionId,
      scoreType,
      value: value as number,
    }));
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = formSubmissionRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form submission payload',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { templateId, submittedBy, status, responses, repeatGroups, calculatedScores } =
      parseResult.data;

    const actor = submittedBy ?? 'anonymous';
    const submissionStatus = status ?? SubmissionStatus.DRAFT;

    if (isDev) {
      console.log('Creating form submission', {
        templateId,
        submittedBy: actor,
        status: submissionStatus,
      });
    }

    const submission = await prisma.formSubmission.create({
      data: {
        templateId,
        submittedBy: actor,
        status: submissionStatus,
        submittedAt:
          submissionStatus === SubmissionStatus.SUBMITTED ? new Date() : null,
      },
    });

    const responseEntries = Object.entries(responses).map(([questionCode, value]) => ({
      submissionId: submission.id,
      questionCode,
      value: value as Prisma.InputJsonValue,
    }));

    if (responseEntries.length > 0) {
      await prisma.questionResponse.createMany({ data: responseEntries });
    }

    const repeatGroupEntries = Object.entries(repeatGroups).flatMap(
      ([questionCode, rows]) =>
        Array.isArray(rows)
          ? rows.map((rowData, index) => ({
              submissionId: submission.id,
              questionCode,
              rowIndex: index,
              data: rowData as Prisma.InputJsonValue,
            }))
          : []
    );

    if (repeatGroupEntries.length > 0) {
      await prisma.repeatableGroupResponse.createMany({ data: repeatGroupEntries });
    }

    const scoreEntries = buildScoreEntries(submission.id, calculatedScores);
    if (scoreEntries.length > 0) {
      await prisma.calculatedScore.createMany({ data: scoreEntries });
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      status: submission.status,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error creating form submission:', err);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save form submission',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('id');
    const templateId = searchParams.get('templateId');
    const submittedBy = searchParams.get('submittedBy');

    if (submissionId) {
      const submission = await prisma.formSubmission.findUnique({
        where: { id: submissionId },
        include: {
          responses: true,
          repeatGroups: true,
          scores: true,
        },
      });

      if (!submission) {
        return NextResponse.json(
          { success: false, error: 'Submission not found' },
          { status: 404 }
        );
      }

      const responses: Record<string, Prisma.JsonValue> = {};
      submission.responses.forEach((response) => {
        responses[response.questionCode] = response.value as Prisma.JsonValue;
      });

      const repeatable: Record<string, unknown[]> = {};
      submission.repeatGroups.forEach((group) => {
        if (!repeatable[group.questionCode]) {
          repeatable[group.questionCode] = [];
        }
        repeatable[group.questionCode][group.rowIndex] = group.data as unknown;
      });

      const calculatedScores: Record<string, number> = {};
      submission.scores.forEach((score) => {
        calculatedScores[score.scoreType] = score.value;
      });

      return NextResponse.json({
        success: true,
        submission: {
          id: submission.id,
          templateId: submission.templateId,
          status: submission.status,
          submittedBy: submission.submittedBy,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          submittedAt: submission.submittedAt,
          responses,
          repeatGroups: repeatable,
          calculatedScores,
        },
      });
    }

    const where: { templateId?: string; submittedBy?: string } = {};
    if (templateId) where.templateId = templateId;
    if (submittedBy) where.submittedBy = submittedBy;

    const submissions = await prisma.formSubmission.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        templateId: true,
        status: true,
        submittedBy: true,
        createdAt: true,
        updatedAt: true,
        submittedAt: true,
      },
    });

    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    const err = error as Error;
    console.error('Error fetching form submissions:', err);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch form submissions',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = formSubmissionUpdateSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form submission payload',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { submissionId, status, responses, repeatGroups, calculatedScores } =
      parseResult.data;

    if (isDev) {
      console.log('Updating form submission', submissionId);
    }

    const submission = await prisma.formSubmission.update({
      where: { id: submissionId },
      data: {
        status: status ?? undefined,
        submittedAt:
          status === SubmissionStatus.SUBMITTED ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    await prisma.questionResponse.deleteMany({ where: { submissionId } });
    await prisma.repeatableGroupResponse.deleteMany({ where: { submissionId } });
    await prisma.calculatedScore.deleteMany({ where: { submissionId } });

    const responseEntries = Object.entries(responses).map(([questionCode, value]) => ({
      submissionId,
      questionCode,
      value: value as Prisma.InputJsonValue,
    }));

    if (responseEntries.length > 0) {
      await prisma.questionResponse.createMany({ data: responseEntries });
    }

    const repeatGroupEntries = Object.entries(repeatGroups).flatMap(
      ([questionCode, rows]) =>
        Array.isArray(rows)
          ? rows.map((rowData, index) => ({
              submissionId,
              questionCode,
              rowIndex: index,
              data: rowData as Prisma.InputJsonValue,
            }))
          : []
    );

    if (repeatGroupEntries.length > 0) {
      await prisma.repeatableGroupResponse.createMany({ data: repeatGroupEntries });
    }

    const scoreEntries = buildScoreEntries(submissionId, calculatedScores);
    if (scoreEntries.length > 0) {
      await prisma.calculatedScore.createMany({ data: scoreEntries });
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      status: submission.status,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error updating form submission:', err);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update form submission',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

import { PrismaClient, SubmissionStatus, Prisma } from '@prisma/client';
import { getPrismaClient } from './prisma-factory';
import { getOptionValues, OptionMapping } from './option-mapper';

// Demo submissions data - reusing the excellent synthetic data structure
const demoSubmissions = [
  {
    submittedBy: 'Dr. Jennifer Martinez',
    status: SubmissionStatus.SUBMITTED,
    responses: {
      'F0.1': 'TECH-2025-002',
      'F0.2': 'Smart Insulin Pump with Predictive Analytics',
      'F0.3': 'Dr. Jennifer Martinez',
      'F0.4': '2025-09-20',
      'F0.7': 'medical_device',
      'F1.1.a': 'An intelligent insulin delivery system that uses machine learning to predict glucose trends and automatically adjust insulin delivery rates. The system integrates continuous glucose monitoring with advanced algorithms to prevent dangerous highs and lows in pediatric diabetic patients.',
      'F1.1.b': 'Pediatric endocrinologists, diabetes nurses, children with Type 1 diabetes (ages 6-18), parents and caregivers of diabetic children.',
      'F1.1.c': 'The system uses a closed-loop algorithm that analyzes CGM data, meal inputs, exercise patterns, and historical glucose trends to predict future glucose levels and automatically adjust basal insulin rates and deliver correction boluses.',
      'F1.1.d': ['Device', 'Software Algorithm'],
      'F1.2.a': 'Validated prototype',
      'F1.2.b': 'Yes',
      'F1.2.c': 'Yes',
      'F1.2.d': 'Yes',
      'F1.2.e': 'Yes',
      'F2.1.a': 'This technology directly supports our mission to improve outcomes for children with chronic conditions. It addresses the critical need for better diabetes management in pediatric populations, potentially reducing hospitalizations and improving quality of life.',
      'F2.1.score': 3,
      'F2.2.a': 'Type 1 diabetes affects approximately 200,000 children in the US. Current insulin pumps require significant manual intervention and often result in suboptimal glucose control. This system could dramatically improve time-in-range and reduce diabetes-related complications.',
      'F2.2.score': 3,
      'F3.1.a': 'Existing insulin pumps (Medtronic 780G, Tandem Control-IQ, Omnipod 5) offer some automation but lack predictive capabilities specific to pediatric physiology. Our system uses pediatric-specific algorithms and integrates more comprehensive data inputs.',
      'F3.2.score': 2,
      'F4.1.a': 'The global insulin pump market is valued at $4.5B and growing at 8% CAGR. Pediatric segment represents 15% of market. Insurance coverage is improving with proven clinical outcomes.',
      'F4.4.a': 3,
      'F4.4.b': 3,
      'F4.4.c': 2,
      'F5.1': 'Yes',
      'F5.2': 'Yes',
      'F5.3': 'No',
      'F5.4': 'Yes',
    },
    repeatGroups: {
      'F0.5': [
        { name: 'Dr. Robert Kim, MD', title: 'MD', department: 'Endocrinology' },
        { name: 'Sarah Chen, PhD', title: 'PhD', department: 'Computer Science' },
      ],
      'F4.2.a': [
        { company: 'Medtronic', product: 'MiniMed 780G', revenue: '$2.8B annually', contact: 'Available through sales team' },
        { company: 'Tandem Diabetes', product: 'Control-IQ', revenue: '$600M annually', contact: 'Partnership opportunities exist' },
        { company: 'Insulet', product: 'Omnipod 5', revenue: '$1.2B annually', contact: 'Competitive landscape' }
      ]
    },
    calculatedScores: {
      missionAlignment: 3,
      unmetNeed: 3,
      ipStrength: 2,
      marketSize: 3,
      patientPopulation: 3,
      competitors: 2,
      impactScore: 3.0,
      valueScore: 2.33,
      marketScore: 2.67
    }
  },
  {
    submittedBy: 'Dr. Michael Thompson',
    status: SubmissionStatus.SUBMITTED,
    responses: {
      'F0.1': 'TECH-2025-003',
      'F0.2': 'VR Pain Distraction Therapy System',
      'F0.3': 'Dr. Michael Thompson',
      'F0.4': '2025-09-18',
      'F0.7': 'digital_health',
      'F1.1.a': 'A virtual reality system specifically designed for pediatric patients undergoing painful procedures. Uses immersive environments and biometric feedback to reduce perceived pain and anxiety during medical treatments.',
      'F1.1.b': 'Pediatric patients ages 4-16, child life specialists, nurses, physicians performing procedures, hospital administrators.',
      'F1.1.c': 'The system uses VR headsets with custom pediatric content, real-time biometric monitoring to adjust immersion levels, and integrated with hospital systems to track pain scores and treatment outcomes.',
      'F1.1.d': ['Software Algorithm', 'Database', 'Device'],
      'F1.2.a': 'Pilot in humans',
      'F1.2.b': 'Yes',
      'F1.2.c': 'Yes',
      'F1.2.d': 'Yes',
      'F1.2.e': 'Partially',
      'F2.1.a': 'Aligns with our mission to provide family-centered care and improve patient experience. Addresses the significant issue of procedural pain and anxiety in children, supporting our goal of holistic pediatric care.',
      'F2.1.score': 2,
      'F2.2.a': 'Millions of pediatric patients undergo painful procedures annually. Current pain management often relies heavily on pharmacological interventions. This technology offers a non-pharmacological alternative that could reduce medication side effects.',
      'F2.2.score': 2,
      'F3.1.a': 'Several VR pain management systems exist (AppliedVR, KindVR) but few are specifically designed for pediatric populations with age-appropriate content and adaptive features based on child development stages.',
      'F3.2.score': 2,
      'F4.1.a': 'Digital therapeutics market is projected to reach $32B by 2030. VR in healthcare specifically valued at $2.4B. Hospital adoption increasing with proven ROI through reduced medication costs and improved patient satisfaction scores.',
      'F4.4.a': 2,
      'F4.4.b': 2,
      'F4.4.c': 3,
      'F5.1': 'Yes',
      'F5.2': 'Yes',
      'F5.3': 'Yes',
      'F5.4': 'No',
    },
    repeatGroups: {
      'F0.5': [
        { name: 'Dr. Alex Rivera, MD', title: 'MD', department: 'Pain Management' },
        { name: 'Jamie Park, MS', title: 'MS', department: 'Game Design' },
      ],
      'F4.2.a': [
        { company: 'AppliedVR', product: 'RelieVRx', revenue: '$50M annually', contact: 'FDA-cleared VR therapeutic' },
        { company: 'KindVR', product: 'Pediatric VR Suite', revenue: '$25M annually', contact: 'Direct competitor' },
        { company: 'Oxford VR', product: 'Medical VR Platform', revenue: '$30M annually', contact: 'Partnership potential' }
      ]
    },
    calculatedScores: {
      missionAlignment: 2,
      unmetNeed: 2,
      ipStrength: 2,
      marketSize: 2,
      patientPopulation: 2,
      competitors: 3,
      impactScore: 2.0,
      valueScore: 2.17,
      marketScore: 2.33
    }
  },
  {
    submittedBy: 'Dr. Lisa Chang',
    status: SubmissionStatus.SUBMITTED,
    responses: {
      'F0.1': 'TECH-2025-004',
      'F0.2': 'Rapid Genetic Screening for Newborns',
      'F0.3': 'Dr. Lisa Chang',
      'F0.4': '2025-09-15',
      'F0.7': 'diagnostic',
      'F1.1.a': 'A rapid genetic screening platform that can identify over 500 genetic conditions in newborns within 6 hours using next-generation sequencing and AI-powered analysis algorithms.',
      'F1.1.b': 'Neonatologists, genetic counselors, NICU staff, laboratory technicians, parents of newborns with suspected genetic conditions.',
      'F1.1.c': 'Uses proprietary library preparation methods, accelerated sequencing protocols, and machine learning algorithms trained on large datasets of pediatric genetic variants to provide rapid, accurate genetic screening results.',
      'F1.1.d': ['Method', 'Software Algorithm', 'Database'],
      'F1.2.a': 'Lab proof of concept',
      'F1.2.b': 'Partially',
      'F1.2.c': 'Yes',
      'F1.2.d': 'Partially',
      'F1.2.e': 'No',
      'F2.1.a': 'Directly supports our mission of providing world-class care for children. Early genetic diagnosis is crucial for optimal treatment planning and family counseling, particularly in our NICU population.',
      'F2.1.score': 3,
      'F2.2.a': 'Current genetic testing for newborns can take weeks, during which time critical treatment decisions may be delayed. Faster results could dramatically improve outcomes for children with treatable genetic conditions.',
      'F2.2.score': 3,
      'F3.1.a': 'Current rapid genetic tests (Illumina TruSight, Invitae) still take 24-48 hours. Our 6-hour turnaround would be industry-leading. However, validation and regulatory approval will be challenging.',
      'F3.2.score': 1,
      'F4.1.a': 'Genetic testing market expected to reach $30B by 2030. Newborn screening specifically is a $2B market. All US states mandate some newborn screening, creating guaranteed demand.',
      'F4.4.a': 3,
      'F4.4.b': 2,
      'F4.4.c': 1,
      'F5.1': 'No',
      'F5.2': 'Yes',
      'F5.3': 'No',
      'F5.4': 'No',
    },
    repeatGroups: {
      'F0.5': [
        { name: 'Dr. Lisa Chang, MD, PhD', title: 'MD, PhD', department: 'Genetics' },
        { name: 'Dr. Peter Walsh, PhD', title: 'PhD', department: 'Bioinformatics' },
      ],
      'F4.2.a': [
        { company: 'Illumina', product: 'NovaSeq Series', revenue: '$3.5B annually', contact: 'Sequencing platform leader' },
        { company: 'Thermo Fisher', product: 'Ion Torrent', revenue: '$2.1B annually', contact: 'Rapid sequencing focus' },
        { company: 'Roche', product: 'AVENIO Platform', revenue: '$1.8B annually', contact: 'Clinical genomics' }
      ]
    },
    calculatedScores: {
      missionAlignment: 3,
      unmetNeed: 3,
      ipStrength: 1,
      marketSize: 3,
      patientPopulation: 2,
      competitors: 1,
      impactScore: 3.0,
      valueScore: 1.5,
      marketScore: 2.0
    }
  },
  {
    // Draft submission - partially completed
    submittedBy: 'Dr. Sarah Johnson',
    status: SubmissionStatus.DRAFT,
    responses: {
      'F0.1': 'TECH-2025-005',
      'F0.2': 'AI-Powered Pediatric Radiology Assistant',
      'F0.3': 'Dr. Sarah Johnson',
      'F0.4': '2025-09-22',
      'F0.7': 'other',
      'F1.1.a': 'An AI system that assists radiologists in detecting abnormalities in pediatric imaging studies, with special focus on rare conditions that are often missed in initial readings.',
      'F1.1.b': 'Pediatric radiologists, general radiologists reviewing pediatric cases, emergency physicians.',
      // Partial responses - this is a draft
      'F2.1.score': 2,
      'F2.2.score': 3,
    },
    repeatGroups: {
      'F0.5': [
        { name: 'Dr. Sarah Johnson, MD', title: 'MD', department: 'Radiology' },
        { name: 'Tom Chen, MS', title: 'MS', department: 'Machine Learning' },
      ],
    },
    calculatedScores: {} // No calculations for draft
  }
];

/**
 * Seeds demo form submissions into the database
 * Idempotent: clears existing demo submissions before inserting
 */
export async function seedDemoSubmissions(
  templateId: string,
  injectedPrisma?: PrismaClient
): Promise<void> {
  const prisma = getPrismaClient(injectedPrisma);
  const optionCache = new Map<string, OptionMapping>();

  const normalizeResponseValue = async (questionCode: string, value: unknown): Promise<unknown> => {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return value;
    }

    let mapping = optionCache.get(questionCode);
    if (!mapping) {
      mapping = await getOptionValues(prisma, questionCode);
      optionCache.set(questionCode, mapping);
    }

    if (!mapping || Object.keys(mapping).length === 0) {
      return value;
    }

    if (typeof value === 'string') {
      return mapping[value] ?? value;
    }

    return value.map((item) => (typeof item === 'string' && mapping![item] ? mapping![item] : item));
  };

  console.log('🎭 Seeding demo form submissions...');

  try {
    // Clear existing submissions to ensure idempotency
    // We identify demo submissions by specific submittedBy patterns
    const demoSubmitterPatterns = [
      'Dr. Jennifer Martinez',
      'Dr. Michael Thompson',
      'Dr. Lisa Chang',
      'Dr. Sarah Johnson'
    ];

    // Delete existing demo submissions
    const deletedSubmissions = await prisma.formSubmission.deleteMany({
      where: {
        submittedBy: {
          in: demoSubmitterPatterns
        }
      }
    });

    if (deletedSubmissions.count > 0) {
      console.log(`  ↻ Cleared ${deletedSubmissions.count} existing demo submissions`);
    }

    // Create new demo submissions
    let createdCount = 0;
    for (const submission of demoSubmissions) {
      const formSubmission = await prisma.formSubmission.create({
        data: {
          templateId,
          submittedBy: submission.submittedBy,
          status: submission.status,
          submittedAt: submission.status === SubmissionStatus.SUBMITTED
            ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last week
            : null,
        },
      });

      // Create question responses
      const responseEntries: Prisma.QuestionResponseCreateManyInput[] = [];
      for (const [questionCode, rawValue] of Object.entries(submission.responses)) {
        const normalizedValue = await normalizeResponseValue(questionCode, rawValue);
        responseEntries.push({
          submissionId: formSubmission.id,
          questionCode,
          value: normalizedValue as Prisma.InputJsonValue,
        });
      }

      if (responseEntries.length > 0) {
        await prisma.questionResponse.createMany({
          data: responseEntries,
        });
      }

      // Create repeatable group responses
      const repeatGroupEntries = Object.entries(submission.repeatGroups).flatMap(
        ([questionCode, rows]) =>
          Array.isArray(rows)
            ? rows.map((rowData, index) => ({
                submissionId: formSubmission.id,
                questionCode,
                rowIndex: index,
                data: rowData as Prisma.InputJsonValue,
              }))
            : []
      );

      if (repeatGroupEntries.length > 0) {
        await prisma.repeatableGroupResponse.createMany({
          data: repeatGroupEntries,
        });
      }

      // Create calculated scores (only for submitted forms)
      if (submission.calculatedScores && Object.keys(submission.calculatedScores).length > 0) {
        const scoreEntries = Object.entries(submission.calculatedScores)
          .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
          .map(([scoreType, value]) => ({
            submissionId: formSubmission.id,
            scoreType,
            value: Number(value),
          }));

        if (scoreEntries.length > 0) {
          await prisma.calculatedScore.createMany({
            data: scoreEntries,
          });
        }
      }

      createdCount++;
      const statusIcon = submission.status === SubmissionStatus.SUBMITTED ? '✅' : '📝';
      console.log(`  ${statusIcon} Created ${submission.status.toLowerCase()} submission: ${submission.responses['F0.2']} (${formSubmission.id})`);
    }

    console.log(`✨ Successfully seeded ${createdCount} demo submissions!`);
    console.log(`   - ${demoSubmissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length} submitted`);
    console.log(`   - ${demoSubmissions.filter(s => s.status === SubmissionStatus.DRAFT).length} draft`);

  } catch (error) {
    console.error('❌ Error seeding demo submissions:', error);
    throw error;
  }
}

/**
 * Verify demo data was seeded correctly
 * Returns submission counts for testing
 */
export async function verifyDemoData(injectedPrisma?: PrismaClient): Promise<{
  total: number;
  submitted: number;
  drafts: number;
}> {
  const prisma = getPrismaClient(injectedPrisma);
  const demoSubmitterPatterns = [
    'Dr. Jennifer Martinez',
    'Dr. Michael Thompson',
    'Dr. Lisa Chang',
    'Dr. Sarah Johnson'
  ];

  const submissions = await prisma.formSubmission.findMany({
    where: {
      submittedBy: {
        in: demoSubmitterPatterns
      }
    },
    select: {
      id: true,
      status: true,
      submittedBy: true,
    },
  });

  return {
    total: submissions.length,
    submitted: submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED).length,
    drafts: submissions.filter((s) => s.status === SubmissionStatus.DRAFT).length,
  };
}

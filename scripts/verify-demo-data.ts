#!/usr/bin/env tsx

import { SubmissionStatus } from '@prisma/client';
import { getPrismaClient } from '../prisma/seed/prisma-factory';

const prisma = getPrismaClient();

/**
 * Verification script for demo data seeding fixes
 *
 * VERIFICATION REQUIREMENTS:
 * 1. Option values match database (F0.7 === 'medical_device', not 'Medical Device')
 * 2. Numbers are typeof 'number' (not strings)
 * 3. JSON arrays are parsed correctly
 */

interface VerificationResult {
  success: boolean;
  errors: string[];
  details: {
    totalSubmissions: number;
    submittedCount: number;
    draftCount: number;
    optionVerified: boolean;
    typeVerified: boolean;
    jsonVerified: boolean;
  };
}

async function verifyDemoData(): Promise<VerificationResult> {
  const errors: string[] = [];
  let optionVerified = false;
  let typeVerified = false;
  let jsonVerified = false;

  console.log('🔍 Verifying demo data integrity...');

  try {
    // Load seeded submissions
    const demoSubmitterNames = [
      'Dr. Jennifer Martinez',
      'Dr. Michael Thompson',
      'Dr. Lisa Chang',
      'Dr. Sarah Johnson'
    ];

    const submissions = await prisma.formSubmission.findMany({
      where: {
        submittedBy: { in: demoSubmitterNames }
      },
      include: {
        responses: true,
        repeatGroups: true,
        scores: true
      }
    });

    console.log(`✅ Found ${submissions.length} demo submissions`);

    if (submissions.length === 0) {
      errors.push('No demo submissions found - seed may have failed');
      return {
        success: false,
        errors,
        details: {
          totalSubmissions: 0,
          submittedCount: 0,
          draftCount: 0,
          optionVerified: false,
          typeVerified: false,
          jsonVerified: false,
        }
      };
    }

    // 1. Verify option values match database (not display labels)
    console.log('🔍 Checking F0.7 option values...');
    for (const submission of submissions) {
      const f07Response = submission.responses.find(r => r.questionCode === 'F0.7');
      if (f07Response) {
        const value = f07Response.value;

        // Check if it's a database value (snake_case), not display label
        if (typeof value === 'string') {
          if (['medical_device', 'digital_health', 'diagnostic', 'therapeutic', 'research_tool', 'other'].includes(value)) {
            console.log(`  ✅ F0.7 value correct: "${value}"`);
            optionVerified = true;
          } else {
            errors.push(`F0.7 has display label "${value}" instead of database value`);
          }
        }
      }
    }

    // 2. Confirm numbers are typeof 'number', not strings
    console.log('🔍 Checking score data types...');
    for (const submission of submissions) {
      for (const score of submission.scores) {
        if (typeof score.value === 'number') {
          console.log(`  ✅ Score ${score.scoreType} is number: ${score.value}`);
          typeVerified = true;
        } else {
          errors.push(`Score ${score.scoreType} is ${typeof score.value}, not number: ${score.value}`);
        }
      }
    }

    // 3. Test JSON arrays are parsed correctly
    console.log('🔍 Checking repeatable group JSON format...');
    for (const submission of submissions) {
      for (const repeatGroup of submission.repeatGroups) {
        const data = repeatGroup.data as unknown;
        if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
          console.log('  ✅ RepeatGroup data is a structured JSON value');
          jsonVerified = true;
        } else {
          errors.push(`RepeatGroup data is not valid JSON: ${typeof data}`);
        }
      }
    }

    const submittedCount = submissions.filter(s => s.status === SubmissionStatus.SUBMITTED).length;
    const draftCount = submissions.filter(s => s.status === SubmissionStatus.DRAFT).length;

    console.log(`📊 Submission counts - Total: ${submissions.length}, Submitted: ${submittedCount}, Drafts: ${draftCount}`);

    const success = errors.length === 0 && optionVerified && typeVerified && jsonVerified;

    return {
      success,
      errors,
      details: {
        totalSubmissions: submissions.length,
        submittedCount,
        draftCount,
        optionVerified,
        typeVerified,
        jsonVerified,
      }
    };

  } catch (error) {
    errors.push(`Database query failed: ${error}`);
    return {
      success: false,
      errors,
      details: {
        totalSubmissions: 0,
        submittedCount: 0,
        draftCount: 0,
        optionVerified: false,
        typeVerified: false,
        jsonVerified: false,
      }
    };
  }
}

async function main() {
  console.log('🚀 Starting demo data verification...\n');

  try {
    const result = await verifyDemoData();

    console.log('\n📋 VERIFICATION RESULTS:');
    console.log('='.repeat(50));

    if (result.success) {
      console.log('✅ All verifications PASSED!');
      console.log(`✓ Option values use database format (not display labels)`);
      console.log(`✓ Scores stored as numbers (not strings)`);
      console.log(`✓ JSON data stored correctly`);
      console.log(`✓ Found ${result.details.totalSubmissions} submissions (${result.details.submittedCount} submitted, ${result.details.draftCount} drafts)`);
    } else {
      console.log('❌ Verification FAILED:');
      result.errors.forEach(error => console.log(`  • ${error}`));

      console.log('\n📊 Status:');
      console.log(`  • Option values: ${result.details.optionVerified ? '✅' : '❌'}`);
      console.log(`  • Type preservation: ${result.details.typeVerified ? '✅' : '❌'}`);
      console.log(`  • JSON format: ${result.details.jsonVerified ? '✅' : '❌'}`);
    }

    console.log('='.repeat(50));

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

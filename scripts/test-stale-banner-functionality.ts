#!/usr/bin/env tsx
/**
 * Test script to verify question revision metadata preservation
 * through the draft auto-save flow
 */

import { prisma } from '../src/lib/prisma';
import { buildSubmissionAnswerMetadata } from '../src/lib/technology/service';
import chalk from 'chalk';

async function testStaleBannerFunctionality() {
  console.log(chalk.blue('\n🧪 Testing Stale Banner Functionality\n'));
  console.log('=' .repeat(60));

  try {
    // Step 1: Find a submission with stale answers
    console.log(chalk.yellow('\n1. Looking for submissions with stale answers...'));
    
    const submissionsWithStale = await prisma.formSubmission.findMany({
      where: {
        responses: {
          path: '$.answerMetadata',
          not: 'null'
        }
      },
      include: {
        responses: {
          include: {
            question: true
          }
        },
        template: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    if (submissionsWithStale.length === 0) {
      console.log(chalk.red('❌ No submissions with stale answers found'));
      console.log(chalk.yellow('\nCreating test data with stale answers...'));
      
      // Create a test submission with stale data
      const template = await prisma.formTemplate.findFirst({
        where: { isActive: true },
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  options: true,
                  dictionaryQuestion: {
                    include: {
                      revisions: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!template) {
        console.log(chalk.red('No active template found'));
        return;
      }

      // Create submission with intentionally stale metadata
      const testSubmission = await prisma.formSubmission.create({
        data: {
          templateId: template.id,
          userId: 'test-user-stale',
          submittedAt: new Date(),
          responses: {
            create: template.sections.flatMap(section =>
              section.questions
                .filter(q => q.dictionaryQuestion?.revisions && q.dictionaryQuestion.revisions.length > 0)
                .slice(0, 3) // Take first 3 questions with revisions
                .map(question => ({
                  questionId: question.id,
                  value: JSON.stringify('Test stale answer'),
                  answerMetadata: {
                    revisionId: 'old-revision-id', // Intentionally old
                    answeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
                  }
                }))
            )
          }
        }
      });

      console.log(chalk.green(`✅ Created test submission with ID: ${testSubmission.id}`));
      submissionsWithStale.push(await prisma.formSubmission.findUniqueOrThrow({
        where: { id: testSubmission.id },
        include: {
          responses: {
            include: {
              question: true
            }
          },
          template: true
        }
      }));
    }

    // Step 2: Test buildSubmissionAnswerMetadata helper
    console.log(chalk.yellow('\n2. Testing buildSubmissionAnswerMetadata helper...'));
    
    for (const submission of submissionsWithStale) {
      console.log(`\nSubmission ID: ${submission.id}`);
      
      // Get the active template
      const activeTemplate = await prisma.formTemplate.findUnique({
        where: { id: submission.templateId },
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  dictionaryQuestion: {
                    include: {
                      revisions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!activeTemplate) {
        console.log(chalk.red('Template not found'));
        continue;
      }

      // Build answer metadata
      const metadata = await buildSubmissionAnswerMetadata(submission.id);
      
      // Check for stale answers
      let staleCount = 0;
      let freshCount = 0;
      
      for (const response of submission.responses) {
        const responseMetadata = (response as any).answerMetadata;
        if (!responseMetadata) continue;
        
        const question = activeTemplate.sections
          .flatMap(s => s.questions)
          .find(q => q.id === response.questionId);
        
        if (!question?.dictionaryQuestion?.revisions?.[0]) continue;
        
        const latestRevisionId = question.dictionaryQuestion.revisions[0].id;
        const isStale = responseMetadata.revisionId !== latestRevisionId;
        
        if (isStale) {
          staleCount++;
          console.log(chalk.yellow(`  ⚠️  Stale: Question "${question.label}" (revision: ${responseMetadata.revisionId} vs latest: ${latestRevisionId})`));
        } else {
          freshCount++;
          console.log(chalk.green(`  ✅ Fresh: Question "${question.label}"`));
        }
      }
      
      console.log(chalk.cyan(`\nSummary: ${staleCount} stale, ${freshCount} fresh answers`));
    }

    // Step 3: Test draft creation and loading
    console.log(chalk.yellow('\n3. Testing draft creation and metadata preservation...'));
    
    const testSubmission = submissionsWithStale[0];
    if (testSubmission) {
      // Create a draft
      const draft = await prisma.draftFormResponse.create({
        data: {
          templateId: testSubmission.templateId,
          userId: 'test-user-draft',
          lastSavedAt: new Date(),
          response: {
            formData: {},
            answerMetadata: metadata // Include the metadata
          }
        }
      });
      
      console.log(chalk.green(`✅ Draft created with ID: ${draft.id}`));
      
      // Load the draft
      const loadedDraft = await prisma.draftFormResponse.findUnique({
        where: { id: draft.id }
      });
      
      if (loadedDraft?.response && typeof loadedDraft.response === 'object' && 'answerMetadata' in loadedDraft.response) {
        console.log(chalk.green('✅ Draft metadata preserved after save'));
        console.log(chalk.cyan('\nMetadata structure:'));
        console.log(JSON.stringify(loadedDraft.response.answerMetadata, null, 2).slice(0, 500) + '...');
      } else {
        console.log(chalk.red('❌ Draft metadata lost after save'));
      }
      
      // Clean up test draft
      await prisma.draftFormResponse.delete({ where: { id: draft.id } });
      console.log(chalk.gray('🧹 Test draft cleaned up'));
    }

    // Step 4: Manual testing instructions
    console.log(chalk.blue('\n\n📋 MANUAL BROWSER TESTING INSTRUCTIONS\n'));
    console.log('=' .repeat(60));
    
    console.log(chalk.white(`
1. Open your browser to http://localhost:3000

2. Navigate to Submissions:
   - Click "View Submissions" or go to /dynamic-form/submissions

3. Find a submission with stale answers:
   - Look for submission from user "test-user-stale" or
   - Any submission created before the question revisions

4. Test the stale banner display:
   - Click "Continue Editing" on the submission
   - You should see yellow warning banners on revised questions
   - The banner should say "This answer was provided for a previous version..."

5. Test draft auto-save:
   - Make any edit to trigger auto-save
   - Wait for the redirect to ?draft=...
   - VERIFY: Stale banners should STILL be visible

6. Test page refresh:
   - Refresh the page (F5)
   - VERIFY: Stale banners should reappear

7. Test updating stale answers:
   - Click on a field with a stale banner
   - Update the answer
   - Trigger auto-save
   - VERIFY: The stale banner should disappear for that question

8. Console checks:
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Look for messages about answerMetadata merging
    `));

    // Step 5: Database verification commands
    console.log(chalk.blue('\n\n🔍 DATABASE VERIFICATION COMMANDS\n'));
    console.log('=' .repeat(60));
    
    console.log(chalk.white(`
# Check draft metadata:
tsx -e "
import { prisma } from './src/lib/prisma';
(async () => {
  const drafts = await prisma.draftFormResponse.findMany({
    take: 5,
    orderBy: { lastSavedAt: 'desc' }
  });
  drafts.forEach(d => {
    console.log('Draft ID:', d.id);
    console.log('Has metadata:', !!(d.response?.answerMetadata));
    console.log('---');
  });
})();"

# Check submission responses:
tsx -e "
import { prisma } from './src/lib/prisma';
(async () => {
  const responses = await prisma.questionResponse.findMany({
    where: { answerMetadata: { not: null } },
    take: 5
  });
  console.log('Responses with metadata:', responses.length);
  responses.forEach(r => {
    console.log('Response:', r.id, 'Metadata:', r.answerMetadata);
  });
})();"
    `));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testStaleBannerFunctionality()
  .then(() => {
    console.log(chalk.green('\n✨ Test script completed successfully!'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('\n💥 Test script failed:'), error);
    process.exit(1);
  });

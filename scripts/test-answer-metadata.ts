import { loadTemplateWithBindings } from '@/lib/technology/service';

async function main() {
  console.log('Testing answerMetadata for TEST-STALE-001...\n');

  const result = await loadTemplateWithBindings({ techId: 'TEST-STALE-001' });

  console.log('=== Answer Metadata ===');
  console.log('Total metadata entries:', Object.keys(result.answerMetadata).length);

  // Look for our test questions
  const testQuestions = [
    'F2.1', // Technology Overview field code
    'F3.1', // Mission Alignment field code
  ];

  console.log('\n=== Checking specific fields ===');
  for (const fieldCode of testQuestions) {
    const metadata = result.answerMetadata[fieldCode];
    if (metadata) {
      console.log(`\n${fieldCode}:`);
      console.log('  Status:', metadata.status);
      console.log('  Dictionary Key:', metadata.dictionaryKey);
      console.log('  Saved Revision ID:', metadata.savedRevisionId);
      console.log('  Current Revision ID:', metadata.currentRevisionId);
      console.log('  Answered At:', metadata.answeredAt);
      console.log('  Source:', metadata.source);
    } else {
      console.log(`\n${fieldCode}: NO METADATA FOUND`);
    }
  }

  console.log('\n=== All Metadata Entries ===');
  for (const [fieldCode, metadata] of Object.entries(result.answerMetadata)) {
    if (metadata.status === 'STALE') {
      console.log(`\n🔴 STALE: ${fieldCode}`);
      console.log('  Dictionary Key:', metadata.dictionaryKey);
      console.log('  Saved Revision:', metadata.savedRevisionId);
      console.log('  Current Revision:', metadata.currentRevisionId);
    }
  }

  console.log('\n=== Initial Responses ===');
  console.log('Response keys:', Object.keys(result.initialResponses));

  // Show first few responses
  const responseEntries = Object.entries(result.initialResponses).slice(0, 5);
  console.table(responseEntries);
}

main().catch(console.error);

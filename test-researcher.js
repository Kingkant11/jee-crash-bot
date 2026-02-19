require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Simulate the Researcher Agent workflow
async function researcherAgentGenerateQuestions() {
  console.log('🔬 Researcher Agent: Generating 10 diagnostic questions...\n');

  const researcherPrompt = `
Generate 10 JEE Main diagnostic questions for Session 2 preparation:
- 4 Physics, 3 Math, 3 Chemistry
- Focus on high-weightage topics: Mechanics, Calculus, Organic Chemistry
- Mix difficulty: 3 easy, 4 medium, 3 hard
- Include topics likely repeated from Session 1
- Make questions JEE-style (conceptual, not just formula application)

RETURN ONLY valid JSON in this exact format:
[
  {
    "q": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "ans": 0,
    "subject": "Physics",
    "chapter": "Mechanics",
    "topic": "Kinematics",
    "difficulty": "medium"
  }
]

Do NOT include any explanation or text outside the JSON.
`;

  let jsonStr;

  try {
    console.log('📤 Sending request to Groq API...\n');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a JEE Main exam researcher. Generate high-quality diagnostic questions in JSON format only.'
          },
          {
            role: 'user',
            content: researcherPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    jsonStr = response.data.choices[0].message.content;

    console.log('📊 Response received!');
    console.log(`   Model: ${response.data.model}`);
    console.log(`   Tokens: ${response.data.usage.total_tokens}`);
    console.log(`   Queue time: ${response.data.usage.queue_time}s`);
    console.log(`   Total time: ${response.data.usage.total_time}s\n`);

    console.log('🔍 Raw LLM response (first 500 chars):');
    console.log(jsonStr.substring(0, 500));
    console.log('...\n');

    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '');

    // Find JSON array
    const jsonStart = jsonStr.indexOf('[');
    const jsonEnd = jsonStr.lastIndexOf(']');

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('❌ No JSON array found in response');
      throw new Error('LLM did not return valid JSON array');
    }

    // Extract just the JSON part
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);

    console.log('🔍 Extracted JSON length:', jsonStr.length, 'characters\n');

    const questions = JSON.parse(jsonStr);

    // Validate it's an array
    if (!Array.isArray(questions)) {
      console.error('❌ Response is not an array:', typeof questions);
      throw new Error('LLM returned invalid format');
    }

    console.log(`✅ Researcher Agent: Generated ${questions.length} questions\n`);

    // Show summary
    const subjects = {};
    questions.forEach(q => {
      subjects[q.subject] = (subjects[q.subject] || 0) + 1;
    });

    console.log('📊 Subject breakdown:');
    Object.entries(subjects).forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count} questions`);
    });

    // Show first 2 questions as sample
    console.log('\n📝 Sample Questions (first 2):');
    questions.slice(0, 2).forEach((q, i) => {
      console.log(`\n${i + 1}. [${q.subject}] ${q.q}`);
      q.options.forEach((opt, j) => {
        const prefix = j === q.ans ? '✓' : ' ';
        console.log(`   ${prefix} ${j + 1}. ${opt}`);
      });
      console.log(`   Chapter: ${q.chapter} | Difficulty: ${q.difficulty}`);
    });

    // Save to file
    const outputFile = 'test_questions.json';
    fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2));
    console.log(`\n💾 Saved to: ${outputFile}`);

    return questions;

  } catch (e) {
    console.error('\n❌ Researcher Agent Error:', e.message);
    if (jsonStr) {
      console.error('🔴 Response that failed:');
      console.error(jsonStr.substring(0, 1000));
    }
    throw e;
  }
}

// Run the test
researcherAgentGenerateQuestions()
  .then(questions => {
    console.log('\n🎉 /test command simulation successful!');
    console.log(`📈 Ready to generate ${questions.length} questions for users.`);
  })
  .catch(err => {
    console.log('\n❌ Test failed:', err.message);
    process.exit(1);
  });

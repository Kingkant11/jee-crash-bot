/**
 * Researcher Agent - Generates Diagnostic Questions
 * Uses Groq LLM to generate JEE Main style questions
 */

const axios = require('axios');

/**
 * Generate 10 diagnostic JEE questions
 */
async function researcherAgentGenerateQuestions() {
  console.log('🔬 Researcher Agent: Generating diagnostic questions...');

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
    "difficulty": "medium",
    "explanation": "Brief explanation for why answer is correct"
  }
]

Do NOT include any explanation or text outside the JSON.
Each question must have a brief explanation field.
`;

  let jsonStr;

  try {
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
        temperature: 0.7, // Higher temperature for variety
        max_tokens: 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    jsonStr = response.data.choices[0].message.content;

    console.log('📊 Groq Response Status:', response.status);
    console.log('📊 Tokens Used:', response.data.usage.total_tokens);
    console.log('🔍 Raw LLM response (first 500 chars):', jsonStr.substring(0, 500));

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

    console.log('🔍 Extracted JSON length:', jsonStr.length, 'characters');

    const questions = JSON.parse(jsonStr);

    // Validate it's an array
    if (!Array.isArray(questions)) {
      console.error('❌ Response is not an array:', typeof questions);
      throw new Error('LLM returned invalid format');
    }

    // Validate each question has required fields
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.q || !q.options || !Array.isArray(q.options) || q.ans === undefined ||
          !q.subject || !q.chapter || !q.topic || !q.difficulty) {
        console.error(`❌ Question ${i} missing required fields:`, q);
        throw new Error(`Question ${i} is incomplete`);
      }

      // Ensure explanation exists
      if (!q.explanation) {
        q.explanation = `Correct answer is option ${q.ans + 1}`;
      }
    }

    console.log(`✅ Researcher Agent: Generated ${questions.length} questions`);

    // Log question distribution
    const subjects = {};
    const difficulties = {};
    questions.forEach(q => {
      subjects[q.subject] = (subjects[q.subject] || 0) + 1;
      difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1;
    });

    console.log('📊 Subject distribution:', subjects);
    console.log('📊 Difficulty distribution:', difficulties);

    return questions;

  } catch (e) {
    console.error('🔴 Researcher Agent Error:', e.message);
    console.error('Failed to parse questions');
    if (jsonStr) {
      console.error('🔴 Response that failed (first 500 chars):', jsonStr.substring(0, 500));
    }
    throw new Error('Failed to generate questions. Please try again.');
  }
}

/**
 * Generate questions for specific subject/chapter (for practice mode)
 */
async function generatePracticeQuestions(criteria) {
  const { subject, chapter, difficulty, count = 10 } = criteria;

  console.log(`🔬 Researcher Agent: Generating ${count} practice questions for ${subject}/${chapter}...`);

  const prompt = `
Generate ${count} JEE Main questions:
- Subject: ${subject}
- Chapter: ${chapter}
- Difficulty: ${difficulty || 'mixed'}
- Mix of conceptual and numerical problems

RETURN ONLY valid JSON array in same format as diagnostic questions.
`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JEE Main question generator. Return JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let jsonStr = response.data.choices[0].message.content
      .replace(/```json/gi, '')
      .replace(/```/g, '');

    const jsonStart = jsonStr.indexOf('[');
    const jsonEnd = jsonStr.lastIndexOf(']');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Invalid JSON response');
    }

    const questions = JSON.parse(jsonStr.substring(jsonStart, jsonEnd + 1));

    console.log(`✅ Generated ${questions.length} practice questions`);
    return questions;

  } catch (e) {
    console.error('🔴 Practice question generation error:', e.message);
    throw new Error('Failed to generate practice questions');
  }
}

module.exports = {
  researcherAgentGenerateQuestions,
  generatePracticeQuestions
};

/**
 * Planner Agent - Creates Personalized 7-Day Study Plans
 * Generates targeted schedules based on student weaknesses
 */

const axios = require('axios');
const markdown = require('../utils/markdown');

/**
 * Generate 7-day personalized study plan
 */
async function plannerAgentGeneratePlan(analysis, userData) {
  console.log('📅 Planner Agent: Creating 7-day personalized plan...');

  const plannerPrompt = `
You are a JEE Main study planner. Create a 7-day crash plan based on this analysis:

STUDENT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

STUDENT INFO:
${userData ? JSON.stringify(userData, null, 2) : 'First time user'}

PLANNER TASK:
Create a 7-day study plan (Session 2 crash course) with:
- Day 1-3: Focus on weakest chapters (identified in analysis)
- Day 4-5: Practice + mock tests
- Day 6: Revision + formula sheets
- Day 7: Full mock test + review

Each day should have:
- 30 targeted questions (not random - based on specific topics)
- Subject-wise breakdown (Physics/Math/Chemistry)
- Topic focus with difficulty progression
- Practice PYQs for covered topics
- Mermaid diagrams for key concepts (2 per day max)

Return plan in this JSON format:
{
  "day_1": {
    "focus": "Mechanics & Calculus (Weakest Areas)",
    "total_questions": 30,
    "subjects": {
      "Physics": 10,
      "Math": 10,
      "Chemistry": 10
    },
    "topics": [
      {
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Kinematics",
        "questions": 5,
        "difficulty": "medium",
        "pyq_year": [2023, 2022]
      }
    ],
    "diagram_1": {
      "type": "mermaid",
      "title": "Newton's Laws Flowchart",
      "code": "graph TD; A[Force] --> B[Acceleration]; B --> C[Velocity]; C --> D[Displacement];"
    },
    "key_formulas": ["v = u + at", "s = ut + 1/2at²"],
    "study_tips": "Focus on understanding the relationship between force and acceleration"
  },
  "day_2": { ... },
  "day_3": { ... },
  "day_4": { ... },
  "day_5": { ... },
  "day_6": { ... },
  "day_7": { ... }
}

Day 7 (Final Day) special:
- Include Session 2 percentile predictor
- Mock test (30 mixed difficulty questions)
- Final review checklist
- Exam-day tips

Return ONLY valid JSON. No explanations outside JSON.
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
            content: 'You are a JEE Main expert study planner. Create personalized 7-day study plans in JSON format.'
          },
          {
            role: 'user',
            content: plannerPrompt
          }
        ],
        temperature: 0.5, // Balanced for creativity and structure
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    jsonStr = response.data.choices[0].message.content;

    console.log('📊 Groq Planner Response Status:', response.status);
    console.log('🔍 Raw plan (first 300 chars):', jsonStr.substring(0, 300));

    // Remove markdown code blocks
    jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '');

    const plan = JSON.parse(jsonStr);

    // Validate structure
    const dayKeys = Object.keys(plan).filter(k => k.startsWith('day_'));
    if (dayKeys.length !== 7) {
      console.error('❌ Plan should have 7 days, found:', dayKeys.length);
      throw new Error('Invalid plan format - missing days');
    }

    console.log('✅ Planner Agent: 7-day plan generated');

    // Validate each day
    dayKeys.forEach(dayKey => {
      const day = plan[dayKey];
      if (!day.focus || !day.subjects || !day.topics) {
        console.warn(`⚠️  Day ${dayKey} incomplete, will use fallback`);
      }
    });

    return plan;

  } catch (e) {
    console.error('🔴 Planner Agent Error:', e.message);
    console.log('🔄 Using fallback plan generation...');

    const plan = fallbackPlan(analysis, userData);

    console.log('✅ Fallback plan complete');
    return plan;
  }
}

/**
 * Fallback 7-day plan (when AI fails)
 */
function fallbackPlan(analysis, userData) {
  const plan = {};

  // Get weakest subjects/chapters
  const weakSubjects = analysis.weakest_chapters
    .map(c => c.subject)
    .filter((v, i, a) => a.indexOf(v) === i);

  const weakChapters = analysis.weakest_chapters.slice(0, 3);

  // Days 1-3: Focus on weak areas
  weakChapters.forEach((chapter, index) => {
    const dayNum = index + 1;
    plan[`day_${dayNum}`] = {
      focus: `${chapter.subject} - ${chapter.chapter} (Priority Area)`,
      total_questions: 30,
      subjects: {
        [chapter.subject]: 20,
        'Math': 5,
        'Chemistry': 5
      },
      topics: [
        {
          subject: chapter.subject,
          chapter: chapter.chapter,
          topic: chapter.topic,
          questions: 10,
          difficulty: 'easy',
          pyq_year: [2023, 2022]
        },
        {
          subject: chapter.subject,
          chapter: chapter.chapter,
          topic: chapter.topic,
          questions: 10,
          difficulty: 'medium',
          pyq_year: [2024, 2023]
        }
      ],
      key_formulas: getFormulasForChapter(chapter),
      study_tips: `Focus on ${chapter.topic} fundamentals - build strong base`
    };
  });

  // Day 4: Mixed practice
  plan.day_4 = {
    focus: 'Mixed Subject Practice + PYQs',
    total_questions: 30,
    subjects: { Physics: 10, Math: 10, Chemistry: 10 },
    topics: [
      { subject: 'Physics', chapter: 'Mixed', topic: 'PYQs 2022-2023', questions: 10, difficulty: 'medium', pyq_year: [2023, 2022] },
      { subject: 'Math', chapter: 'Mixed', topic: 'PYQs 2022-2023', questions: 10, difficulty: 'medium', pyq_year: [2023, 2022] },
      { subject: 'Chemistry', chapter: 'Mixed', topic: 'PYQs 2022-2023', questions: 10, difficulty: 'medium', pyq_year: [2023, 2022] }
    ],
    key_formulas: ['Revise all formulas covered so far'],
    study_tips: 'Focus on speed and accuracy - time yourself'
  };

  // Day 5: Mock test style
  plan.day_5 = {
    focus: 'Mock Test Style Questions',
    total_questions: 30,
    subjects: { Physics: 10, Math: 10, Chemistry: 10 },
    topics: [
      { subject: 'Physics', chapter: 'Mixed', topic: 'Mixed difficulty', questions: 10, difficulty: 'hard', pyq_year: [] },
      { subject: 'Math', chapter: 'Mixed', topic: 'Mixed difficulty', questions: 10, difficulty: 'hard', pyq_year: [] },
      { subject: 'Chemistry', chapter: 'Mixed', topic: 'Mixed difficulty', questions: 10, difficulty: 'hard', pyq_year: [] }
    ],
    key_formulas: ['Ensure calculator is allowed', 'Practice mental math'],
    study_tips: 'Simulate exam conditions - no breaks'
  };

  // Day 6: Revision
  plan.day_6 = {
    focus: 'Revision + Formula Review',
    total_questions: 20,
    subjects: { Physics: 8, Math: 6, Chemistry: 6 },
    topics: [
      { subject: 'Physics', chapter: 'All', topic: 'Quick revision', questions: 8, difficulty: 'easy', pyq_year: [] },
      { subject: 'Math', chapter: 'All', topic: 'Quick revision', questions: 6, difficulty: 'easy', pyq_year: [] },
      { subject: 'Chemistry', chapter: 'All', topic: 'Quick revision', questions: 6, difficulty: 'easy', pyq_year: [] }
    ],
    key_formulas: ['Create formula cheat sheet', 'Memorize key reactions'],
    study_tips: 'Focus on high-weightage topics only'
  };

  // Day 7: Final mock + percentile
  const estimatedPercentile = calculatePercentile(analysis.session2_impact.estimated_score);

  plan.day_7 = {
    focus: 'Final Mock Test + Session 2 Prep',
    total_questions: 30,
    subjects: { Physics: 10, Math: 10, Chemistry: 10 },
    topics: [
      { subject: 'Physics', chapter: 'All', topic: 'Final mock', questions: 10, difficulty: 'medium', pyq_year: [] },
      { subject: 'Math', chapter: 'All', topic: 'Final mock', questions: 10, difficulty: 'medium', pyq_year: [] },
      { subject: 'Chemistry', chapter: 'All', topic: 'Final mock', questions: 10, difficulty: 'medium', pyq_year: [] }
    ],
    percentile_predictor: {
      estimated_score: analysis.session2_impact.estimated_score,
      predicted_percentile: estimatedPercentile,
      rank_range: `Top ${(100 - estimatedPercentile * 2).toFixed(1)}% - ${(100 - estimatedPercentile * 3).toFixed(1)}%`
    },
    key_formulas: ['Relax and trust your preparation'],
    study_tips: 'Get good sleep, stay calm, believe in yourself'
  };

  return plan;
}

/**
 * Generate simple mermaid diagram for chapter
 */
function generateConceptDiagram(chapter) {
  const diagrams = {
    'Mechanics': 'graph TD; A[Force] --> B[Acceleration]; B --> C[Velocity]; C --> D[Displacement];',
    'Calculus': 'graph TD; A[Function] --> B[Derivative]; B --> C[Integral]; C --> D[Area];',
    'Organic Chemistry': 'graph TD; A[Reactants] --> B[Mechanism]; B --> C[Transition State]; C --> D[Products];'
  };

  return diagrams[chapter.chapter] || 'graph TD; A[Concept] --> B[Understanding]; B --> C[Mastery];';
}

/**
 * Get formulas for chapter
 */
function getFormulasForChapter(chapter) {
  const formulas = {
    'Mechanics': ['v = u + at', 's = ut + 1/2at²', 'F = ma', 'KE = 1/2mv²'],
    'Calculus': ['d/dx(xⁿ) = nxⁿ⁻¹', '∫xⁿ dx = xⁿ⁺¹/(n+1)', '∫eˣ dx = eˣ'],
    'Organic Chemistry': ['Markovnikov Rule', 'Anti-Markovnikov Rule', 'SN1 vs SN2 mechanisms']
  };

  return formulas[chapter.chapter] || ['Revise all key formulas'];
}

/**
 * Calculate estimated percentile based on score
 */
function calculatePercentile(score) {
  // Simplified percentile estimation for Session 2
  const percentiles = {
    0: 10, 50: 30, 100: 50, 150: 70, 200: 85, 250: 95, 300: 99
  };

  // Interpolate
  const scores = Object.keys(percentiles).map(Number).sort((a, b) => a - b);

  for (let i = 0; i < scores.length - 1; i++) {
    if (score >= scores[i] && score < scores[i + 1]) {
      const ratio = (score - scores[i]) / (scores[i + 1] - scores[i]);
      return percentiles[scores[i]] + ratio * (percentiles[scores[i + 1]] - percentiles[scores[i]]);
    }
  }

  if (score >= 300) return 99;
  return 10;
}

/**
 * Format plan as Telegram message (MarkdownV2 safe)
 */
function formatPlanMessage(plan) {
  let message = markdown.bold('📅 Your 7-Day JEE Session 2 Crash Plan') + '\n\n';

  Object.entries(plan).forEach(([dayKey, day], index) => {
    const dayNum = index + 1;

    // Day header
    message += markdown.bold(`━━━ DAY ${dayNum} ━━━`) + '\n';
    message += `📌 ${day.focus}\n`;
    message += `📊 ${day.total_questions} questions:\n`;

    // Subject breakdown
    Object.entries(day.subjects).forEach(([subject, count]) => {
      const emoji = subject === 'Physics' ? '📘' : subject === 'Math' ? '📐' : '🧪';
      message += `${emoji}${subject}: ${count} `;
    });

    message += '\n';

    // Key topics
    if (day.topics && day.topics.length > 0) {
      message += '📚 ' + markdown.bold('Key Topics:') + ' ';
      day.topics.slice(0, 3).forEach((topic, i) => {
        message += markdown.bold(topic.chapter) + ' ';
      });
      message += '\n';
    }

    // Formulas (use inline code to prevent parsing issues)
    if (day.key_formulas && day.key_formulas.length > 0) {
      message += '📐 ' + markdown.bold('Formulas:') + ' ';
      day.key_formulas.forEach((formula, i) => {
        message += markdown.formatFormula(formula) + (i < day.key_formulas.length - 1 ? ', ' : '\n');
      });
    }

    // Tips
    if (day.study_tips) {
      message += '💡 ' + markdown.bold(day.study_tips) + '\n';
    }

    // Percentile predictor on Day 7
    if (dayKey === 'day_7' && day.percentile_predictor) {
      const pp = day.percentile_predictor;
      message += '\n' + markdown.bold('📈 Session 2 Prediction:') + '\n';
      message += `• Estimated Score: ${pp.estimated_score}/300\n`;
      message += `• Predicted Percentile: ~${pp.predicted_percentile}%\n`;
      message += `• Expected Rank: ${pp.rank_range}\n`;
    }

    message += '\n';
  });

  return message;
}

module.exports = {
  plannerAgentGeneratePlan,
  formatPlanMessage
};

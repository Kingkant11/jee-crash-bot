/**
 * Analyst Agent - Analyzes Test Results
 * Identifies weak areas and patterns in student performance
 */

const axios = require('axios');
const markdown = require('../utils/markdown');

/**
 * Analyze test results and generate detailed report
 */
async function analystAgentAnalyze(testData, userProgress = []) {
  console.log('📊 Analyst Agent: Analyzing test results...');

  const analystPrompt = `
You are a JEE Main expert analyst. Analyze this student's test data:

STUDENT TEST DATA:
${JSON.stringify(testData, null, 2)}

${userProgress.length > 0 ? `
STUDENT PROGRESS HISTORY (previous tests):
${JSON.stringify(userProgress.slice(-5), null, 2)}
` : ''}

JEE ANALYST TASK:
1. Calculate subject-wise scores (Physics/Math/Chemistry) out of 10
2. Identify the 3 WEAKEST chapters (accuracy < 60%)
3. Detect error patterns (conceptual / calculation / silly mistake)
4. Estimate Session 2 marks impact
5. Provide actionable study recommendations

Return analysis in this JSON format:
{
  "subject_scores": {
    "Physics": {"score": 3, "total": 4, "percentage": 75},
    "Math": {"score": 2, "total": 3, "percentage": 66.7},
    "Chemistry": {"score": 2, "total": 3, "percentage": 66.7}
  },
  "weakest_chapters": [
    {
      "subject": "Physics",
      "chapter": "Mechanics",
      "topic": "Kinematics",
      "accuracy": 50,
      "issues": "conceptual misunderstanding of equations"
    }
  ],
  "error_patterns": {
    "conceptual": 3,
    "calculation": 4,
    "silly_mistake": 1,
    "dominant": "calculation"
  },
  "session2_impact": {
    "estimated_score": 180,
    "potential_score": 240,
    "loss": 60,
    "recommendation": "Focus on calculation accuracy to gain 60 marks"
  },
  "recommendations": [
    "Practice more numerical problems in Mechanics",
    "Revise basic calculus formulas daily",
    "Focus on organic reaction mechanisms"
  ]
}

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
            content: 'You are a JEE Main expert analyst. Analyze test results and provide detailed JSON analysis.'
          },
          {
            role: 'user',
            content: analystPrompt
          }
        ],
        temperature: 0.3, // Lower for consistency
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

    console.log('📊 Groq Analysis Response Status:', response.status);
    console.log('🔍 Raw analysis (first 300 chars):', jsonStr.substring(0, 300));

    // Remove markdown code blocks
    jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '');

    const analysis = JSON.parse(jsonStr);

    // Validate structure
    if (!analysis.subject_scores || !analysis.weakest_chapters || !analysis.error_patterns) {
      console.error('❌ Analysis missing required fields:', Object.keys(analysis));
      throw new Error('Invalid analysis format');
    }

    console.log('✅ Analyst Agent: Analysis complete');
    console.log('📊 Subject scores:', analysis.subject_scores);
    console.log('⚠️  Weakest chapters:', analysis.weakest_chapters.length);
    console.log('🔍 Dominant error pattern:', analysis.error_patterns.dominant);

    return analysis;

  } catch (e) {
    console.error('🔴 Analyst Agent Error:', e.message);

    // Fallback to rule-based analysis
    console.log('🔄 Using fallback rule-based analysis...');

    const analysis = fallbackAnalysis(testData);

    console.log('✅ Fallback analysis complete');
    return analysis;
  }
}

/**
 * Fallback rule-based analysis (when AI fails)
 */
function fallbackAnalysis(testData) {
  const subjectScores = {
    'Physics': { correct: 0, total: 0 },
    'Math': { correct: 0, total: 0 },
    'Chemistry': { correct: 0, total: 0 }
  };

  const chapterScores = {};
  const errorTypes = {
    conceptual: 0,
    calculation: 0,
    silly_mistake: 0
  };

  testData.forEach(test => {
    const { subject, chapter, is_correct } = test;

    // Subject scores
    if (subjectScores[subject]) {
      subjectScores[subject].total++;
      if (is_correct) subjectScores[subject].correct++;
    }

    // Chapter scores
    const key = `${subject}-${chapter}`;
    if (!chapterScores[key]) {
      chapterScores[key] = { correct: 0, total: 0 };
    }
    chapterScores[key].total++;
    if (is_correct) chapterScores[key].correct++;

    // Error type (simplified based on difficulty)
    if (!is_correct) {
      if (test.difficulty === 'easy') {
        errorTypes.silly_mistake++;
      } else if (test.difficulty === 'medium') {
        errorTypes.calculation++;
      } else {
        errorTypes.conceptual++;
      }
    }
  });

  // Find weakest chapters
  const weakestChapters = Object.entries(chapterScores)
    .filter(([_, scores]) => scores.total >= 2)
    .map(([key, scores]) => ({
      subject: key.split('-')[0],
      chapter: key.split('-')[1],
      accuracy: Math.round((scores.correct / scores.total) * 100)
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  // Subject percentages
  const subjectPercentages = {};
  Object.entries(subjectScores).forEach(([subject, scores]) => {
    subjectPercentages[subject] = {
      score: scores.correct,
      total: scores.total,
      percentage: scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0
    };
  });

  // Dominant error type
  const dominantError = Object.entries(errorTypes)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Estimate Session 2 impact (simplified)
  const totalCorrect = Object.values(subjectScores).reduce((sum, s) => sum + s.correct, 0);
  const percentage = (totalCorrect / testData.length) * 100;

  const estimatedScore = Math.round(180 + (percentage - 50) * 2);
  const potentialScore = Math.min(estimatedScore + 60, 300);

  return {
    subject_scores: subjectPercentages,
    weakest_chapters: weakestChapters.map(c => ({
      ...c,
      topic: c.chapter,
      issues: `Low accuracy (${c.accuracy}%) - needs focused practice`
    })),
    error_patterns: {
      ...errorTypes,
      dominant: dominantError
    },
    session2_impact: {
      estimated_score: estimatedScore,
      potential_score: potentialScore,
      loss: potentialScore - estimatedScore,
      recommendation: `Improve ${dominantError} errors to gain ${potentialScore - estimatedScore} marks`
    },
    recommendations: generateRecommendations(subjectPercentages, weakestChapters)
  };
}

/**
 * Generate study recommendations based on performance
 */
function generateRecommendations(subjectPercentages, weakestChapters) {
  const recommendations = [];

  // Subject-specific recommendations
  Object.entries(subjectPercentages).forEach(([subject, data]) => {
    if (data.percentage < 50) {
      recommendations.push(`⚠️  ${subject}: Major weak area - spend 60% time here`);
    } else if (data.percentage < 70) {
      recommendations.push(`📊 ${subject}: Needs improvement - allocate 40% time`);
    } else {
      recommendations.push(`✅ ${subject}: Good foundation - maintain with daily practice`);
    }
  });

  // Chapter-specific recommendations
  weakestChapters.slice(0, 2).forEach(c => {
    recommendations.push(`🎯 Focus on ${c.chapter} (${c.subject}) - practice 10+ questions daily`);
  });

  return recommendations;
}

/**
 * Generate formatted analysis message for Telegram
 */
function formatAnalysisMessage(analysis) {
  let message = markdown.bold('📊 TEST ANALYSIS') + '\n\n';

  // Subject scores
  message += markdown.bold('Subject-wise Performance:') + '\n';
  Object.entries(analysis.subject_scores).forEach(([subject, data]) => {
    const emoji = data.percentage >= 70 ? '✅' : data.percentage >= 50 ? '📊' : '⚠️ ';
    message += `${emoji} ${subject}: ${data.score}/${data.total} (${data.percentage}%)\n`;
  });

  // Weakest chapters
  if (analysis.weakest_chapters.length > 0) {
    message += '\n' + markdown.bold('⚠️  Weakest Chapters:') + '\n';
    analysis.weakest_chapters.forEach((chapter, i) => {
      message += `${i + 1}. ${chapter.chapter} (${chapter.subject}) - ${chapter.accuracy}%\n`;
    });
  }

  // Error patterns
  message += '\n' + markdown.bold('🔍 Error Patterns:') + '\n';
  const errors = analysis.error_patterns;
  message += `• Conceptual: ${errors.conceptual}\n`;
  message += `• Calculation: ${errors.calculation}\n`;
  message += `• Silly Mistakes: ${errors.silly_mistake}\n`;
  message += `→ Dominant: ${markdown.bold(errors.dominant)}\n`;

  // Session 2 impact
  message += '\n' + markdown.bold('📈 Session 2 Impact:') + '\n';
  const impact = analysis.session2_impact;
  message += `• Estimated Score: ${impact.estimated_score}/300\n`;
  message += `• Potential Score: ${impact.potential_score}/300\n`;
  message += `• Marks at Risk: ${markdown.bold(impact.loss)}\n`;
  message += `💡 ${impact.recommendation}\n`;

  // Recommendations
  if (analysis.recommendations.length > 0) {
    message += '\n' + markdown.bold('💡 Recommendations:') + '\n';
    analysis.recommendations.slice(0, 5).forEach(rec => {
      message += `• ${rec}\n`;
    });
  }

  return message;
}

module.exports = {
  analystAgentAnalyze,
  formatAnalysisMessage
};

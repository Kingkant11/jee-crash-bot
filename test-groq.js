require('dotenv').config();
const axios = require('axios');

// Test Groq API directly
async function testGroqAPI() {
  console.log('🔬 Testing Groq API (Llama 3.3 70B)...\n');

  const provider = process.env.LLM_PROVIDER || 'groq';
  console.log(`📌 Provider: ${provider}`);
  console.log(`📌 API Key: ${process.env.GROQ_API_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`📌 Model: ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}\n`);

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a JEE Main expert tutor. Return valid JSON only.'
          },
          {
            role: 'user',
            content: `Generate 1 simple JEE Math question in this exact JSON format:
[
  {
    "q": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "ans": 0,
    "subject": "Math",
    "chapter": "Calculus",
    "topic": "Derivatives",
    "difficulty": "easy"
  }
]

Return ONLY JSON, no other text.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ API Call Successful!\n');
    console.log('📊 Response Status:', response.status);
    console.log('📊 Model Used:', response.data.model);
    console.log('📊 Tokens Used:', response.data.usage);
    console.log('\n📝 Generated Question (Raw):');
    console.log(response.data.choices[0].message.content);

    // Try to parse as JSON
    try {
      const jsonStr = response.data.choices[0].message.content
        .replace(/```json/gi, '')
        .replace(/```/g, '');

      const question = JSON.parse(jsonStr);

      if (Array.isArray(question)) {
        console.log('\n✅ JSON Parse Successful!\n');
        console.log('🎯 Question Details:');
        console.log(question[0]);
        return { success: true, question: question[0] };
      } else {
        console.log('\n⚠️  Response is not an array');
        return { success: false, error: 'Not an array' };
      }
    } catch (parseError) {
      console.log('\n❌ JSON Parse Failed:', parseError.message);
      return { success: false, error: parseError.message };
    }

  } catch (error) {
    console.log('\n❌ API Call Failed!');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

// Run the test
testGroqAPI().then(result => {
  if (result.success) {
    console.log('\n🎉 All tests passed! Groq is working correctly.');
  } else {
    console.log('\n❌ Test failed. Check the error above.');
  }
  process.exit(result.success ? 0 : 1);
});

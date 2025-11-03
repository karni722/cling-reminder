const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access your API key
const genAI = new GoogleGenerativeAI('AIzaSyCw4oLkj3o55xLf-cnu3pKp2rJvsKBUr4k');

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    console.log('Model initialized, attempting to generate...');
    
    const result = await model.generateContent([
      { text: "Write a short greeting" },
    ]);

    console.log('Generation completed, getting response...');
    const response = await result.response;
    const text = response.text();
    console.log('Generated text:', text);
  } catch (error) {
    console.error('Error occurred:');
    console.error('Message:', error.message);
    console.error('Status:', error.status);
    console.error('Details:', error.details);
  }
}

console.log('Starting Gemini API test...');
run().then(() => console.log('Test completed!')).catch(e => console.error('Top level error:', e));
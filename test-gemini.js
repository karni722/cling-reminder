const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access your API key
const genAI = new GoogleGenerativeAI('AIzaSyCw4oLkj3o55xLf-cnu3pKp2rJvsKBUr4k');

async function run() {
  // For text-only input, use the correct model version
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Using the proper content structure
  const prompt = {
    contents: [{
      parts: [{ text: "Write a short greeting" }]
    }]
  };

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
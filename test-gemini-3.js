const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure the API key and client
const API_KEY = 'AIzaSyCw4oLkj3o55xLf-cnu3pKp2rJvsKBUr4k';
const genAI = new GoogleGenerativeAI(API_KEY, {
    apiVersion: 'v1'
});

async function testGemini() {
    try {
        // Get the model
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.0-pro',
            generationConfig: {
                temperature: 0.9,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
            },
        });
        
        console.log('Model initialized...');

        // Create a simple prompt
        const prompt = 'Write a short greeting';

        // Generate content
        console.log('Generating content...');
        const result = await model.generateContent(prompt);
        console.log('Getting response...');
        const response = await result.response;
        const text = response.text();
        console.log('Generated text:', text);
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            details: error.details,
            stack: error.stack
        });
    }
}

console.log('Starting Gemini test...');
testGemini()
    .then(() => console.log('Test complete'))
    .catch(error => console.error('Top level error:', error));
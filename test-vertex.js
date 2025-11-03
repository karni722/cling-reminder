const { VertexAI } = require('@google-cloud/vertexai');

// Your Google Cloud project ID and location
const projectId = 'your-project-id';
const location = 'us-central1';

// Create a client
const vertexAI = new VertexAI({
    project: projectId,
    location: location,
});

async function generateText() {
    try {
        // Get the text model
        const model = vertexAI.preview.getGenerativeModel({
            model: 'gemini-pro',
        });

        // Generate text
        const request = {
            prompt: 'Write a short greeting',
        };

        console.log('Sending request to Gemini...');
        const response = await model.generateText(request);
        console.log('Response:', response);

    } catch (error) {
        console.error('Error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
        });
    }
}

generateText();
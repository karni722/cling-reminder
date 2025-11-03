const { TextServiceClient } = require('@google-ai/generative-ai').v1beta3;
const { GoogleAuth } = require('google-auth-library');

const MODEL_NAME = 'models/text-bison-001';

async function run() {
    try {
        const auth = new GoogleAuth({
            credentials: {
                client_email: 'your-service-account@your-project.iam.gserviceaccount.com',
                private_key: process.env.GOOGLE_PRIVATE_KEY,
            },
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        const client = new TextServiceClient({
            authClient: auth,
        });

        console.log('Attempting to generate text...');

        const request = {
            model: MODEL_NAME,
            prompt: {
                text: 'Write a short greeting',
            },
        };

        const [response] = await client.generateText(request);
        console.log('Response:', response.candidates[0].output);

    } catch (error) {
        console.error('Error occurred:');
        console.error('Message:', error.message);
        if (error.details) console.error('Details:', error.details);
    }
}

console.log('Starting API test...');
run().then(() => console.log('Test completed!')).catch(e => console.error('Top level error:', e));
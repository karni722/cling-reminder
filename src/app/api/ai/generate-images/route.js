import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// NOTE: Next.js automatically loads the .env file.
if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Initialize the model with the correct model name
const model = ai.getGenerativeModel({ model: "gemini-1.0-pro" });

/**
 * Handle POST request to generate icon suggestions using Gemini AI.
 * @param {Request} request - The incoming Next.js request object.
 */
export async function POST(request) {
    // 1. Request Body se description nikalna
    let description;
    try {
        const body = await request.json();
        description = body.description;
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }

    if (!description || description.trim() === '') {
        return NextResponse.json({ error: 'Description is required for AI generation.' }, { status: 400 });
    }

    try {
        // 2. Generate Icon Keywords using Gemini Pro
        let iconKeywordsText;
        try {
            const prompt = {
                contents: [{
                    parts: [{
                        text: `Generate four highly creative, simple, one-word keywords for icons that best represent the reminder description: "${description}". Separate them with commas only. The output must ONLY contain the four keywords. Example: 'Bike Service' -> 'Wrench, Helmet, Oil, Road'.`
                    }]
                }]
            };

            const result = await model.generateContent(prompt);
            const response = await result.response;
            iconKeywordsText = response.text();
        } catch (error) {
            console.error('Gemini API Error:', error);
            return NextResponse.json({ 
                error: 'Failed to generate keywords using AI',
                details: error.message 
            }, { status: 500 });
        }
        
        // Keywords ko array mein badalna aur saaf karna
        const keywords = iconKeywordsText.split(',')
                                         .map(k => k.trim())
                                         .filter(k => k.length > 0)
                                         .slice(0, 4); // Max 4 keywords lenge

        // 3. Placeholder Image URLs Generate Karna
        // Hum keywords ko dummyimage.com ki URL mein convert kar rahe hain 
        // taki frontend mein images dikh sakein.
        const imageUrls = keywords.map(keyword => {
            // URL ko encode karna
            const encodedText = keyword.toUpperCase().replace(/\s/g, '+');
            return `https://dummyimage.com/150x150/10b981/ffffff&text=${encodedText}`;
        });
        
        // Agar keywords nahi mile, toh ek default icon URL de do
        if (imageUrls.length === 0) {
             imageUrls.push(`https://dummyimage.com/150x150/6b7280/ffffff&text=Default`);
        }

        // 4. URLs ko Frontend ko wapas bhejna
        return NextResponse.json({ urls: imageUrls }, { status: 200 });

    } catch (error) {
        console.error("Gemini AI Integration Error:", error);
        // Error ko frontend tak pahunchana
        return NextResponse.json({ 
            error: 'Failed to generate image suggestions using Gemini. Check backend console for details.', 
            details: error.message 
        }, { status: 500 });
    }
}
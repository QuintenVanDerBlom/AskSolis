import express from 'express';
import cors from 'cors';
import { AzureChatOpenAI } from '@langchain/openai';

const TREFFLE_API_KEY = 'pJwYWYhbn1B-2P-2xqh1tbfd1_WHHBvy9f3DEvJETbY'; 
const TREFFLE_BASE_URL = 'https://trefle.io/api/v1';

const model = new AzureChatOpenAI({
    temperature: 0.7,
    streaming: true, // Enable streaming
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// List of keywords related to nature and plants
const natureKeywords = [
    'nature', 'plant', 'tree', 'forest', 'flower', 'leaf', 'grass', 'garden',
    'ecosystem', 'wildlife', 'botany', 'flora', 'fauna', 'environment', 'soil',
    'photosynthesis', 'rainforest', 'desert', 'mountain', 'river', 'ocean',
    'animal', 'bird', 'insect', 'climate', 'biodiversity', 'conservation'
];

// In-memory message history with roles
let messageHistory = [];

// Add request processing flag
let isProcessingRequest = false;

// Function to check if the prompt is related to nature or plants
function isNatureRelated(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    return natureKeywords.some(keyword => lowerPrompt.includes(keyword));
}

app.get('/', async (req, res) => {
    try {
        const result = await tellJoke();
        // Add the joke to history as an assistant message
        messageHistory.push({ role: 'assistant', content: result });
        res.json({ message: result, history: messageHistory });
    } catch (error) {
        console.error('Error in GET /:', error);
        res.status(500).json({ error: 'Failed to fetch joke' });
    }
});

// Add delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch plant data from Trefle.io
async function fetchPlantData(plantName) {
    try {
        const searchUrl = `${TREFFLE_BASE_URL}/plants/search?token=${TREFFLE_API_KEY}&q=${encodeURIComponent(plantName)}`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error(`Trefle API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching plant data:', error);
        return null;
    }
}

// Function to format plant data for the model
function formatPlantData(plantData) {
    if (!plantData || !plantData.data || plantData.data.length === 0) {
        return null;
    }

    const plant = plantData.data[0]; // Get the first matching plant
    const attribution = `\n\n[Data provided by Trefle.io - The Global Plant Database. Learn more at https://trefle.io/plants/${plant.id}]`;
    
    return {
        scientificName: plant.scientific_name,
        commonName: plant.common_name,
        family: plant.family,
        familyCommonName: plant.family_common_name,
        year: plant.year,
        bibliography: plant.bibliography,
        attribution: attribution
    };
}

app.post('/', async (req, res) => {
    try {
        // Check if there's already a request being processed
        if (isProcessingRequest) {
            return res.status(429).json({ 
                error: 'Please wait for the previous request to complete before sending a new one.',
                history: messageHistory 
            });
        }

        // Set the processing flag
        isProcessingRequest = true;

        const prompt = req.body.prompt;
        if (!prompt) {
            isProcessingRequest = false;
            return res.status(400).json({ error: 'Prompt is required', history: messageHistory });
        }

        // Check if the prompt is nature/plant-related
        if (!isNatureRelated(prompt)) {
            const errorMessage = 'Sorry, I can only answer questions related to nature and plants. Please ask about topics like plants, trees, wildlife, or the environment.';
            // Add both user message and error response to history
            messageHistory.push(
                { role: 'user', content: prompt },
                { role: 'assistant', content: errorMessage }
            );
            isProcessingRequest = false;
            return res.status(400).json({ message: errorMessage, history: messageHistory });
        }

        console.log('The user asked for:', prompt);

        // Add user message to history
        messageHistory.push({ role: 'user', content: prompt });

        // Check if the prompt contains a specific plant name
        const plantNameMatch = prompt.match(/(?:about|tell me about|what is|describe)\s+([a-zA-Z\s]+)/i);
        let plantData = null;
        
        if (plantNameMatch) {
            const plantName = plantNameMatch[1].trim();
            const rawPlantData = await fetchPlantData(plantName);
            plantData = formatPlantData(rawPlantData);
        }

        // Format the conversation history for the model
        const formattedHistory = messageHistory.map(msg => 
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n\n');

        // Create the prompt with plant data if available
        let fullPrompt = formattedHistory;
        if (plantData) {
            fullPrompt += `\n\nHere is some information about ${plantData.commonName || plantData.scientificName}:\n` +
                         `Scientific Name: ${plantData.scientificName}\n` +
                         `Common Name: ${plantData.commonName || 'Not available'}\n` +
                         `Family: ${plantData.family} (${plantData.familyCommonName || 'No common name'})\n` +
                         `Year Discovered: ${plantData.year || 'Unknown'}\n` +
                         `Bibliography: ${plantData.bibliography || 'Not available'}\n\n` +
                         `Please use this information to answer the user's question. Always include the attribution at the end of your response.`;
        }
        
        fullPrompt += `\n\nAssistant:`;

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let fullResponse = '';
        
        // Stream the response
        const stream = await model.stream(fullPrompt);
        for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
                // Add a random delay between 20-50ms to simulate natural typing speed
                await delay(Math.floor(Math.random() * 30) + 20);
            }
        }

        // Add attribution if plant data was used
        if (plantData) {
            fullResponse += plantData.attribution;
            res.write(`data: ${JSON.stringify({ content: plantData.attribution })}\n\n`);
        }

        // Add assistant's response to history
        messageHistory.push({ role: 'assistant', content: fullResponse });

        // End the stream
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Error in POST /:', error);
        res.status(500).json({ error: 'Failed to process prompt', history: messageHistory });
    } finally {
        // Always reset the processing flag, even if there was an error
        isProcessingRequest = false;
    }
});

async function tellJoke() {
    const joke = await model.invoke('Tell me a joke about plants or nature!');
    return joke.content;
}

app.listen(3000, () => console.log('App listening on port 3000!'));
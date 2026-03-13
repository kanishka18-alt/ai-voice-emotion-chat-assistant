const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)); 
require('dotenv').config();

const express = require('express');
const cors = require('cors'); 

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const TIMEOUT_MS = 120000; // 2 minutes

const app = express();

// SECURITY CHECK: Ensures the API key is present before starting
if (!GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: Please ensure GEMINI_API_KEY environment variable is set in your server/.env file.");
    process.exit(1);
}

// CORS Configuration: Allows requests from your frontend ports
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'] 
}));

// Body Parser Middleware (Increased limit to handle audio base64 data)
app.use(express.json({ limit: '10mb' }));

/**
 * Robust fetch function with timeout and abort controller.
 */
async function fetchWithTimeout(url, options, timeout = TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

/**
 * Selects a voice name based on the detected emotion.
 * @param {string} emotion - The emotion detected (e.g., JOY, SADNESS).
 * @returns {string} The name of the prebuilt voice to use.
 */
function getVoiceName(emotion) {
    const upperEmotion = emotion.toUpperCase();
    switch (upperEmotion) {
        case 'JOY':
        case 'LOVE':
        case 'SURPRISE':
            return 'Puck'; // Upbeat, friendly
        case 'SADNESS':
        case 'ANGER':
        case 'FEAR':
            return 'Kore'; // Firm, supportive, non-judgmental
        case 'NEUTRAL':
        case 'ERROR':
        default:
            return 'Achird'; // Friendly, standard
    }
}


// ----------------------------------------------------------------------------------
// The Core Two-Stage Multimodal API Route: /api/chat (LLM -> TTS)
// ----------------------------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
    try {
        const { message: userMessage, audio_data: audioData, audio_mime_type: audioMimeType } = req.body;

        if (!userMessage && !audioData) {
            return res.status(400).json({ response: "Missing 'message' or 'audio_data' in request body.", emotion: "ERROR" });
        }
        
        const isVoiceInput = !!audioData;

        console.log(`\n[Pipeline Start] Input Type: ${isVoiceInput ? 'Voice' : 'Text'}. Message/Data received.`);

        // --- Step 1: Combined Emotion Detection and Response Generation (LLM Call) ---
        const llmModel = "gemini-2.5-flash";
        const llmUrl = `https://generativelanguage.googleapis.com/v1beta/models/${llmModel}:generateContent?key=${GEMINI_API_KEY}`;
        
        // **INSTRUCTION FOR MULTIMODAL/TEXT INPUT**
        const instructionPrompt = `Analyze the user's input (either text or voice transcription) for its primary emotion. The possible emotions are: JOY, SADNESS, ANGER, FEAR, LOVE, SURPRISE, or NEUTRAL.

        **PERSONA**: You are an extremely enthusiastic, invested, and non-judgmental close friend. Your tone must be highly expressive and use contractions (like 'you're'). Use **1-2 relevant emojis** and **exclamation points** in every reply to show active engagement.

        **LENGTH & FLOW**: Generate a thoughtful, conversational reply that **deeply reflects** the user's emotion. Offer gentle validation or supportive perspective. The reply must be **concise (1-2 sentences)**. Only ask a specific question if it's natural and necessary.

        ${!isVoiceInput 
            ? `User Text: "${userMessage}"` 
            : 'Analyze the provided audio for content and tone, and provide the exact transcription of the user\'s speech.'
        }

        Return the output exclusively as a JSON object that strictly follows this schema:`; // <-- Instruction changed to 1-2 sentences
        
        // Construct the multimodal/text content payload
        const contents = [
            { role: "user", parts: [{ text: instructionPrompt }] }
        ];
        
        if (isVoiceInput) {
            // If audio is provided, add the Base64 data to the parts array
            contents[0].parts.push({
                inlineData: {
                    mimeType: audioMimeType,
                    data: audioData
                }
            });
        }

        let parsedResponse;
        
        try {
            const llmPayload = {
                contents: contents,
                generationConfig: {
                    temperature: 0.8, 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            emotion: { type: "STRING", description: "The single detected primary emotion (e.g., JOY, SADNESS, NEUTRAL). Must be one of: JOY, SADNESS, ANGER, FEAR, LOVE, SURPRISE, NEUTRAL." },
                            response: { type: "STRING", description: "The conversational friend-like reply, including emojis, ending with a specific question only if necessary for flow." },
                            user_transcription: { type: "STRING", description: "The verbatim transcription of the user's voice input. If the input was text, return the original user text here." }
                        },
                        required: ["emotion", "response", "user_transcription"],
                    }
                }
            };

            const llmResponse = await fetchWithTimeout(llmUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(llmPayload)
            });

            if (llmResponse.status !== 200) {
                const errorBodyText = await llmResponse.text();
                console.error(`[LLM Call Failure] Gemini API failed (Status: ${llmResponse.status}) Body: ${errorBodyText}`);
                throw new Error(`Gemini LLM Call failed (Status ${llmResponse.status})`);
            }

            const llmResult = await llmResponse.json();
            const responseJsonText = llmResult.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!responseJsonText) {
                console.error(`[LLM Call Warning] Gemini returned empty or malformed JSON text. Assuming filter block.`);
                throw new Error("LLM returned no usable text due to filtering.");
            }

            // Attempt to parse the structured JSON output
            parsedResponse = JSON.parse(responseJsonText);
            
            console.log(`[Step 1 Success] Detected Emotion: ${parsedResponse.emotion}. Response generated: "${parsedResponse.response.substring(0, 50)}..."`);


            // --- Step 2: Text-to-Speech (TTS) Call ---
            const ttsModel = "gemini-2.5-flash-preview-tts";
            const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${GEMINI_API_KEY}`;
            const ttsText = parsedResponse.response;
            const detectedEmotion = parsedResponse.emotion.toUpperCase();
            const ttsVoice = getVoiceName(detectedEmotion);

            const ttsSystemPrompt = ttsText; // Use the response text directly for TTS

            const ttsPayload = {
                contents: [{
                    parts: [{ text: ttsSystemPrompt }]
                }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: ttsVoice }
                        }
                    }
                },
                model: ttsModel
            };

            const ttsResponse = await fetchWithTimeout(ttsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ttsPayload)
            });

            if (ttsResponse.status !== 200) {
                const errorBodyText = await ttsResponse.text();
                console.error(`[TTS Call Failure] TTS API failed (Status: ${ttsResponse.status}) Body: ${errorBodyText}`);
                throw new Error(`Gemini TTS Call failed (Status ${ttsResponse.status})`);
            }

            const ttsResult = await ttsResponse.json();
            const ttsPart = ttsResult.candidates?.[0]?.content?.parts?.[0];
            const audioData = ttsPart?.inlineData?.data;
            const mimeType = ttsPart?.inlineData?.mimeType;

            if (!audioData || !mimeType) {
                 console.error(`[TTS Call Warning] TTS returned empty audio data.`);
                 throw new Error("TTS failed to generate audio data.");
            }

            console.log(`[Step 2 Success] TTS audio generated using voice: ${ttsVoice} (${mimeType}).`);

            // --- Step 3: Send Response to Frontend (Combined) ---
            res.status(200).json({
                response: parsedResponse.response,
                emotion: detectedEmotion,
                user_transcription: parsedResponse.user_transcription,
                audio_response_data: audioData, // Base64 audio data
                audio_mime_type: mimeType // e.g., audio/L16; rate=16000
            });

        } catch (error) {
            console.error(`[Pipeline Error] Final Error during processing: ${error.message}`);
            
            // Fail-safe final response
            res.status(500).json({ 
                response: `Hey! My entire system just did a massive tech hiccup—I'm so sorry! Can you just tell me in a few words how you're feeling right now so I can reset our conversation?`,
                emotion: 'ERROR',
                user_transcription: isVoiceInput ? "(Transcription Failed)" : userMessage || "N/A",
                audio_response_data: null,
                audio_mime_type: null
            });
        }
    } catch (e) {
        // TOP-LEVEL CATCH: Final fallback for any uncaught synchronous error
        console.error(`[UNCAUGHT SERVER ERROR] A synchronous error occurred: ${e.message}`);
        res.status(500).json({
            response: `FATAL SERVER CRASH: The request crashed. Check server console.`,
            emotion: 'ERROR',
            user_transcription: "N/A",
            audio_response_data: null,
            audio_mime_type: null
        });
    }
});


// START SERVER
app.listen(PORT, () => {
    console.log(`\n✅ Backend Proxy Server running on http://localhost:${PORT}`);
    console.log("   Architecture: Two-Stage Multimodal (Text/Voice) JSON Generation -> TTS Audio Generation");
    console.log("   CORS is set for http://localhost:8080, http://localhost:8081, and http://localhost:5173\n");
});
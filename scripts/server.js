const express = require('express');
const fetch = require('node-fetch');
const multer = require('multer');
const pdfParse = require('pdf-parse');

require('dotenv').config({ path: './scripts/keys.env' });

const app = express();
const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const path = require('path');
app.use(express.json());

// Serve favicon specifically BEFORE static files
const faviconPath = path.join(__dirname, '..', 'assets', 'favicon.ico');
app.get('/favicon.ico', (req, res) => {
    res.sendFile(faviconPath, err => {
        if (err) {
            console.error('Favicon error:', err);
            res.status(404).end();
        }
    });
});

// Serve everything from project root so all folders are accessible
app.use(express.static(path.join(__dirname, '..')));

// GEMINI API CALL FOR TEXT GENERATION  ====================================================================================
app.post('/api/gemini', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                }),
            }
        );
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ========================================================================================================================

// GEMINI API CALL FOR PDF TOKEN COUNT ====================================================================================

// Configure multer for file uploads 
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint to calculate token cost for a PDF
app.post('/api/pdf-token-count', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        // Using pdf-parse to extract text from the PDF buffer
        const pdfData = await pdfParse(req.file.buffer);
        const pdfText = pdfData.text;

        // Use Gemini's countTokens API to get accurate token count
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:countTokens?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: pdfText,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
        }

        const tokenData = await response.json();
        
        res.json({
            totalTokens: tokenData.totalTokens || 0,
            pageCount: pdfData.numpages,
            textLength: pdfText.length
        });
    } catch (err) {
        console.error('Token count error:', err);
        res.status(500).json({ error: err.message });
    }
});
// ========================================================================================================================

// GEMINI API CALL FOR PDF SUMMARIZATION WITH STRUCTURED OUTPUT ============================================

app.post('/api/summarize-pdf', upload.single('pdf'), async (req, res) => {
    try {
        
        // Ensure a file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        // Parse the prompt from the request body
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided' });
        }

        // Define the chunked summary schema for structured output
        const chunkedSummarySchema = {
            type: "object",
            properties: {
                document_title: {
                    type: "string",
                    description: "The main title of the document."
                },
                executive_summary: {
                    type: "string",
                    description: "A concise, 4-5 sentence executive summary of the document's purpose and overall findings."
                },
                key_findings: {
                    type: "array",
                    items: { type: "string" },
                    description: "A list of 3 of the most critical, high-level conclusions or data points from the entire PDF."
                },
                section_summaries: {
                    type: "array",
                    description: "A list of summaries for the major content chunks of the document.",
                    items: {
                        type: "object",
                        properties: {
                            page_range: {
                                type: "string",
                                description: "The range of pages covered by this summary (e.g., '1-10')."
                            },
                            summary_points: {
                                type: "array",
                                items: { type: "string" },
                                description: "Exactly 3 distinct bullet points summarizing the core content of this page range."
                            }
                        },
                        required: ["page_range", "summary_points"]
                    }
                }
            },
            required: ["document_title", "executive_summary", "key_findings", "section_summaries"]
        };

        // Extract text from PDF
        const pdfData = await pdfParse(req.file.buffer);
        const pdfText = pdfData.text;

        // Use Gemini's structured output feature
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `${prompt}\n\nDocument Content:\n${pdfText}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: chunkedSummarySchema
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('PDF summarization error:', err);
        res.status(500).json({ error: err.message });
    }
});
// ========================================================================================================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/index.html`);
});
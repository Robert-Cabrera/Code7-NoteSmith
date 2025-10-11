const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config({ path: './scripts/keys.env' });

const app = express();
const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const path = require('path');
app.use(express.json());
// Serve everything from project root so all folders are accessible
app.use(express.static(path.join(__dirname, '..')));

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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/index.html`);
});
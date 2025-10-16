const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { readUsers, writeUsers, findUserByID } = require('../utils/userManager');

// GEMINI API CALL FOR CRASH COURSE WITH STRUCTURED OUTPUT
router.post('/', async (req, res) => {
    try {
        const { prompt, userId } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // Load the crash course schema from data_objects/CrashCoursePrompt.json
        const crashCoursePromptPath = path.join(__dirname, '..', '..', 'data_objects', 'CrashCoursePrompt.json');
        const crashCourseSchema = JSON.parse(fs.readFileSync(crashCoursePromptPath, 'utf8'));

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
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: crashCourseSchema
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
        
        // Save to user's crash courses if userId provided
        if (userId) {
            const usersData = readUsers();
            const userIndex = usersData.users.findIndex(u => u.id === userId);
            
            if (userIndex !== -1) {
                const crashCourse = {
                    id: `cc_${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    prompt: prompt,
                    content: data
                };
                
                usersData.users[userIndex].crashCourses.push(crashCourse);
                writeUsers(usersData);
            }
        }
        
        res.json(data);
    } catch (err) {
        console.error('Crash course generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get user's crash courses
router.get('/user/:userId', (req, res) => {
    try {
        const user = findUserByID(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ crashCourses: user.crashCourses || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a crash course
router.delete('/user/:userId/:courseId', (req, res) => {
    try {
        const usersData = readUsers();
        const userIndex = usersData.users.findIndex(u => u.id === req.params.userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        usersData.users[userIndex].crashCourses = 
            usersData.users[userIndex].crashCourses.filter(cc => cc.id !== req.params.courseId);
        
        writeUsers(usersData);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

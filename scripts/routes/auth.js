const express = require('express');
const router = express.Router();
const { readUsers, generateUserId, insertUserSorted } = require('../utils/userManager');

// Login endpoint
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password required' });
        }
        
        const usersData = readUsers();
        const user = usersData.users.find(u => 
            u.username === username && u.password === password
        );
        
        if (user) {
            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    username: user.username, 
                    email: user.email,
                    profilePicture: user.profilePicture 
                } 
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Register endpoint
router.post('/register', (req, res) => {
    try {
        const { username, email, password, profilePicture } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Username, email, and password required' });
        }
        
        const usersData = readUsers();
        
        if (usersData.users.find(u => u.username === username || u.email === email)) {
            return res.status(409).json({ success: false, error: 'User already exists' });
        }
        
        const newUser = {
            id: generateUserId(),
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
            profilePicture: profilePicture || "",
            crashCourses: [],
            summaries: []
        };
        
        insertUserSorted(newUser);
        
        res.json({ 
            success: true, 
            user: { 
                id: newUser.id, 
                username: newUser.username, 
                email: newUser.email,
                profilePicture: newUser.profilePicture
            } 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, '..', 'data_objects', 'users.json');

// Helper function to read users
function readUsers() {
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
}

// Helper function to write users
function writeUsers(userData) {
    fs.writeFileSync(usersPath, JSON.stringify(userData, null, 2), 'utf8');
}

// Helper function to ensure userID is incrementally assigned
function generateUserId() {
    const usersData = readUsers();
    const users = usersData.users;

    if (users.length === 0) { 
        return "user_001"; 
    }

    const lastUser = users[users.length - 1];
    const lastIdNum = parseInt(lastUser.id.split('_')[1]);
    const newIdNum = lastIdNum + 1;

    return `user_${String(newIdNum).padStart(3, '0')}`;
}

// Insert user in sorted order by ID
function insertUserSorted(newUser) {
    const usersData = readUsers();
    usersData.users.push(newUser);
    writeUsers(usersData);
    return newUser;
}

// Find user by ID using Binary Search
function findUserByID(userId) {
    function BinarySearch(users, targetId) {
        let left = 0;
        let right = users.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const midId = users[mid].id;
            if (midId === targetId) {
                return users[mid];
            } else if (midId < targetId) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return null;
    }

    const usersData = readUsers();
    const users = usersData.users;
    return BinarySearch(users, userId);
}

module.exports = {
    readUsers,
    writeUsers,
    generateUserId,
    insertUserSorted,
    findUserByID
};

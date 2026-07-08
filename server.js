const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const DB_FILE = path.join(__dirname, 'users.json');

function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { 
            users: [], 
            admin: { 
                username: 'admin', 
                password: bcrypt.hashSync('2113', bcrypt.genSaltSync(10))
            } 
        };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function checkAdmin(username, password) {
    const db = readDB();
    if (username === db.admin.username) {
        return bcrypt.compareSync(password, db.admin.password);
    }
    return false;
}

function initAdmin() {
    const db = readDB();
    if (!db.admin || !db.admin.password) {
        const salt = bcrypt.genSaltSync(10);
        db.admin = {
            username: 'admin',
            password: bcrypt.hashSync('2113', salt)
        };
        writeDB(db);
        console.log('✅ Admin yaratildi: admin / 2113');
    }
}

function registerUser(fullname, email, password, phone) {
    const db = readDB();
    const existing = db.users.find(u => u.email === email);
    if (existing) {
        return { success: false, message: 'Bu email allaqachon ro\'yxatdan o\'tgan!' };
    }
    
    // Parolni OCHIQ saqlaymiz
    db.users.push({
        id: Date.now(),
        fullname: fullname,
        email: email,
        password: password,
        phone: phone || '',
        created_at: new Date().toISOString()
    });
    writeDB(db);
    return { success: true, message: 'Ro\'yxatdan o\'tish muvaffaqiyatli!' };
}

function getAllUsers() {
    const db = readDB();
    return db.users;
}

initAdmin();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/register', (req, res) => {
    const { fullname, email, password, phone } = req.body;
    if (!fullname || !email || !password) {
        return res.json({ success: false, message: 'Iltimos, barcha maydonlarni to\'ldiring!' });
    }
    const result = registerUser(fullname, email, password, phone);
    res.json(result);
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.post('/api/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (checkAdmin(username, password)) {
        res.json({ success: true, message: 'Admin tizimga kirdi!' });
    } else {
        res.json({ success: false, message: 'Noto\'g\'ri login yoki parol!' });
    }
});

app.get('/api/admin-dashboard', (req, res) => {
    const users = getAllUsers();
    res.json({ success: true, users: users });
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.listen(PORT, () => {
    console.log('🚀 Server ishga tushdi: http://localhost:' + PORT);
    console.log('🇺🇿 O\'zbekiston vakolatnoma tizimi');
    console.log('👤 Admin: admin / 2113');
});

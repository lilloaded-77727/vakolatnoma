const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ===== MONGODB ULASH =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(MONGODB_URI);
let db, usersCollection;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('vakolatnoma');
        usersCollection = db.collection('users');
        console.log('✅ MongoDB ga ulandi!');
    } catch (error) {
        console.error('❌ MongoDB xatosi:', error);
    }
}
connectDB();

// ===== FUNKSIYALAR =====
async function initAdmin() {
    const admin = await usersCollection.findOne({ email: 'admin' });
    if (!admin) {
        const salt = bcrypt.genSaltSync(10);
        await usersCollection.insertOne({
            email: 'admin',
            password: bcrypt.hashSync('2113', salt),
            fullname: 'Admin',
            isAdmin: true,
            created_at: new Date().toISOString()
        });
        console.log('✅ Admin yaratildi: admin / 2113');
    }
}
initAdmin();

async function registerUser(fullname, email, password, phone) {
    const existing = await usersCollection.findOne({ email: email });
    if (existing) {
        return { success: false, message: 'Bu email allaqachon ro\'yxatdan o\'tgan!' };
    }
    
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    
    await usersCollection.insertOne({
        fullname: fullname,
        email: email,
        password: hashedPassword,
        phone: phone || '',
        created_at: new Date().toISOString()
    });
    return { success: true, message: 'Ro\'yxatdan o\'tish muvaffaqiyatli!' };
}

async function getAllUsers() {
    return await usersCollection.find({ isAdmin: { $ne: true } }).toArray();
}

async function checkAdmin(username, password) {
    const admin = await usersCollection.findOne({ email: username, isAdmin: true });
    if (admin) {
        return bcrypt.compareSync(password, admin.password);
    }
    return false;
}

// ===== ROUTES =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/register', async (req, res) => {
    const { fullname, email, password, phone } = req.body;
    if (!fullname || !email || !password) {
        return res.json({ success: false, message: 'Iltimos, barcha maydonlarni to\'ldiring!' });
    }
    const result = await registerUser(fullname, email, password, phone);
    res.json(result);
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.post('/api/admin-login', async (req, res) => {
    const { username, password } = req.body;
    if (await checkAdmin(username, password)) {
        res.json({ success: true, message: 'Admin tizimga kirdi!' });
    } else {
        res.json({ success: false, message: 'Noto\'g\'ri login yoki parol!' });
    }
});

app.get('/api/admin-dashboard', async (req, res) => {
    const users = await getAllUsers();
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
});
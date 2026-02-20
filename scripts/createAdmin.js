
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('Could not connect to MongoDB', err);
        process.exit(1);
    });

const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

const createAdmin = async () => {
    try {
        const email = process.argv[2] || await askQuestion('Enter Admin Email: ');
        const password = process.argv[3] || await askQuestion('Enter Admin Password: ');

        if (!email || !password) {
            console.log('Email and password are required.');
            process.exit(1);
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log('Admin with this email already exists.');
            process.exit(0);
        }

        const admin = new Admin({ email, password });
        await admin.save();
        console.log(`Admin created successfully: ${email}`);
    } catch (error) {
        console.error('Error creating admin:', error.message);
    } finally {
        mongoose.disconnect();
        rl.close();
    }
};

createAdmin();

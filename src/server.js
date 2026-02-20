require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

const Admin = require('./models/Admin');

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Seed Admin User
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            await Admin.create({
                email: 'shinashussain585@gmail.com',
                password: 'shinashussain',
            });
            console.log('Admin user seeded successfully');
        }
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err.message);
    });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testScan() {
    try {
        const form = new FormData();
        // Use an existing file from uploads if possible, or create a dummy one
        const files = fs.readdirSync(path.join(__dirname, 'uploads'));
        const imageFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png'));

        if (!imageFile) {
            console.log('No image found in uploads/ to test with.');
            return;
        }

        const filePath = path.join(__dirname, 'uploads', imageFile);
        console.log(`Testing scan with file: ${filePath}`);

        form.append('receipt', fs.createReadStream(filePath));

        const response = await axios.post('http://localhost:5000/api/expenses/scan', form, {
            headers: {
                ...form.getHeaders(),
                // Authorization: 'Bearer ...' // We need a token if protected.
                // The route IS protected. We need to login first.
            }
        });

        console.log('Scan Result:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// We need to login to get a token
async function run() {
    try {
        // Register or Login a test user
        // Try Logging in with a known user or create one
        // I'll try the admin credentials if I knew them, or just a new user
        // Let's assume there's a user from the logs?

        // Actually, let's just inspect the route and TEMPORARILY remove protection for testing?
        // No, that's risky.

        // let's try to login as 'admin' '123456' (common) or create a temp user
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        console.log('Got token:', token);

        const form = new FormData();
        const files = fs.readdirSync(path.join(__dirname, 'uploads'));
        const imageFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png'));

        if (!imageFile) {
            console.log('No image file found');
            return;
        }
        const filePath = path.join(__dirname, 'uploads', imageFile);
        form.append('receipt', fs.createReadStream(filePath));

        const res = await axios.post('http://localhost:5000/api/expenses/scan', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        console.log('Scan Success:', res.data);

    } catch (e) {
        if (e.response && e.response.status === 401) {
            // User might not exist, try register
            try {
                const regRes = await axios.post('http://localhost:5000/api/auth/register', {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });
                const token = regRes.data.token;
                console.log('Registered & Got token:', token);

                // NOW SCAN
                const form = new FormData();
                const files = fs.readdirSync(path.join(__dirname, 'uploads'));
                const imageFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png'));
                const filePath = path.join(__dirname, 'uploads', imageFile);
                form.append('receipt', fs.createReadStream(filePath));

                const res = await axios.post('http://localhost:5000/api/expenses/scan', form, {
                    headers: {
                        ...form.getHeaders(),
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log('Scan Success:', res.data);

            } catch (regError) {
                console.error('Register failed:', regError.response?.data || regError.message);
            }
        } else {
            console.error('Login/Scan Failed:', e.response?.data || e.message);
        }
    }
}

run();

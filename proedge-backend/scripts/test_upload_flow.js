const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@proedge.com';
const ADMIN_PASSWORD = 'admin123';

const runTest = async () => {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.data.token; // Adapt based on actual response
        console.log('   Login successful. Token acquired.');

        console.log('2. Requesting Signed URL...');
        const fileName = 'test-upload.txt';
        const fileType = 'text/plain';

        const signRes = await axios.post(`${API_URL}/upload/signed-url`, {
            fileName,
            fileType,
            folder: 'test'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('   Signed URL Response:', signRes.data);
        const { uploadUrl, key } = signRes.data.data;

        if (!uploadUrl) throw new Error('No uploadUrl returned!');
        console.log('   Got Upload URL:', uploadUrl);

        console.log('3. Uploading file to S3...');
        // Create dummy buffer
        const fileContent = 'This is a test upload from the automated verification script.';

        // IMPORTANT: Using axios for PUT binary upload
        const uploadRes = await axios.put(uploadUrl, fileContent, {
            headers: {
                'Content-Type': fileType
            }
        });

        console.log('   Upload Status:', uploadRes.status);
        if (uploadRes.status === 200) {
            console.log('✅ SUCCESS: File uploaded successfully to S3!');
        } else {
            console.error('❌ FAILED: S3 returned status', uploadRes.status);
        }

    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('   Response Data:', error.response.data);
            console.error('   Response Status:', error.response.status);
        }
    }
};

runTest();

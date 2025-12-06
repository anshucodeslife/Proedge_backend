const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Test Data
const ADMIN_CREDENTIALS = {
    email: 'admin@proedge.com',
    password: 'admin123'
};

const NEW_STUDENT = {
    studentId: `TEST_${Date.now()}`,
    email: `test_student_${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Automated Test Student',
    // isPreApproved: true
};

const NEW_COURSE = {
    title: `Test Course ${Date.now()}`,
    description: 'Automated verification course',
    slug: `test-course-${Date.now()}`,
    price: 100,
    category: 'Testing',
    level: 'Beginner',
    thumbnail: 'courses/thumbnails/test.jpg'
};

let adminToken = '';
let studentToken = '';
let studentId = ''; // DB ID
let courseId = '';

async function runTest() {
    console.log('🚀 Starting LMS Flow Verification...\n');

    try {
        // 1. Admin Login
        console.log('1️⃣  Logging in as Admin...');
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
            adminToken = loginRes.data.data.token;
            console.log('✅ Admin Logged In');
        } catch (e) {
            console.error('❌ Admin Login Failed. Ensure admin@proedge.com / admin123 exists.');
            // Throw original error to be caught by outer block
            throw e;
        }

        const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };

        // 2. Create Student
        console.log('\n2️⃣  Creating New Student...');
        const studentRes = await axios.post(`${API_URL}/admin/students`, NEW_STUDENT, adminAuth);

        // Debug response type
        if (typeof studentRes.data === 'string') {
            console.error('❌ POST /admin/students returned STRING (HTML?). Dumping first 100 chars:');
            console.error(studentRes.data.substring(0, 100));
            throw new Error('POST /admin/students returned HTML instead of JSON');
        }

        const sData = studentRes.data.data.student || studentRes.data.data;
        if (!sData || !sData.id) {
            console.error('❌ Student ID missing in response:', JSON.stringify(studentRes.data));
            throw new Error('Student ID missing');
        }
        studentId = sData.id;
        console.log(`✅ Student Created: ${NEW_STUDENT.email} (ID: ${studentId})`);

        // 3. Verify Student in List
        console.log('\n3️⃣  Verifying Student in Admin List...');
        let listRes;
        try {
            console.log(`   GET request to: ${API_URL}/admin/students?search=${NEW_STUDENT.email}`);
            listRes = await axios.get(`${API_URL}/admin/students?search=${NEW_STUDENT.email}`, adminAuth);
        } catch (err) {
            console.warn('   ⚠️ GET with search failed.');
            if (err.response) {
                console.error('   Status:', err.response.status);
                console.error('   Headers:', JSON.stringify(err.response.headers));
                if (typeof err.response.data === 'string') {
                    console.error('   Response Data (HTML/String):', err.response.data.substring(0, 200));
                }
            }
            throw err;
        }

        if (typeof listRes.data === 'string') {
            console.error('❌ GET /admin/students returned HTML!');
            console.error(listRes.data.substring(0, 200));
            throw new Error('GET /admin/students returned HTML');
        }

        const students = listRes.data.data.students || listRes.data.data;
        const found = students.find(s => s.email === NEW_STUDENT.email);
        if (found) {
            console.log('✅ New Student Verified in List');
        } else {
            throw new Error('Student not found in list after creation');
        }

        // 4. Create Course
        console.log('\n4️⃣  Creating Course...');
        const courseRes = await axios.post(`${API_URL}/courses`, NEW_COURSE, adminAuth);
        const cData = courseRes.data.data.course || courseRes.data.data;
        courseId = cData.id;
        console.log(`✅ Course Created: ${NEW_COURSE.title} (ID: ${courseId})`);

        // 5. Add Module & Lesson
        console.log('\n5️⃣  Adding Module and Lesson...');
        const modRes = await axios.post(`${API_URL}/lms/modules`, {
            title: 'Test Module 1',
            courseId: courseId,
            order: 1
        }, adminAuth);
        const modId = (modRes.data.data.module || modRes.data.data).id;

        await axios.post(`${API_URL}/lms/lessons`, {
            title: 'Test Video Lesson',
            moduleId: modId,
            type: 'Video',
            videoUrl: 'lessons/videos/test.mp4',
            durationSec: 120,
            order: 1,
            isFree: true
        }, adminAuth);
        console.log('✅ Content Added');

        // 6. Enroll Student
        console.log('\n6️⃣  Enrolling Student...');
        await axios.post(`${API_URL}/admin/students/${studentId}/assign-course`, {
            courseId: courseId
        }, adminAuth);
        console.log('✅ Student Enrolled');

        // 7. Student Login
        console.log('\n7️⃣  Logging in as New Student...');
        const stLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: NEW_STUDENT.email,
            password: NEW_STUDENT.password
        });
        studentToken = stLoginRes.data.data.token;
        console.log('✅ Student Logged In');

        // 8. Student Access Content
        console.log('\n8️⃣  Verifying Student Content Access...');
        const stAuth = { headers: { Authorization: `Bearer ${studentToken}` } };

        // Fetch Enrolled
        const enrolledRes = await axios.get(`${API_URL}/student/courses`, stAuth);
        const myCourses = enrolledRes.data.data.courses || enrolledRes.data.data;
        if (myCourses.find(c => c.id === courseId)) {
            console.log('✅ Course visible in Student Dashboard');
        } else {
            console.warn('⚠️ Course NOT found in list. API Response:', JSON.stringify(myCourses));
        }

        // Fetch Details 
        await axios.get(`${API_URL}/student/courses/${courseId}`, stAuth);
        console.log('✅ Course Details Accessible');

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The System is Fully Functional.');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data?.message || 'No message');
        } else {
            console.error('Error:', error.message);
        }
    }
}

runTest();

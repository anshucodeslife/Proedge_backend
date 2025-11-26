# API Endpoint Test Script
Write-Host "=== Proedge Backend API Test ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testResults = @()

# Test 1: Get Courses (Public)
Write-Host "Test 1: GET /courses (Public)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/courses" -Method GET -ErrorAction Stop
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    Write-Host "  Courses found: $($response.data.courses.Count)" -ForegroundColor Gray
    $testResults += @{Test="GET /courses"; Status="PASS"}
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test="GET /courses"; Status="FAIL"}
}
Write-Host ""

# Test 2: Login
Write-Host "Test 2: POST /auth/login" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@proedge.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $token = $loginResponse.token
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    Write-Host "  User: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "  Role: $($loginResponse.user.role)" -ForegroundColor Gray
    $testResults += @{Test="POST /auth/login"; Status="PASS"}
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test="POST /auth/login"; Status="FAIL"}
    $token = $null
}
Write-Host ""

# Test 3: Get Profile (Protected)
if ($token) {
    Write-Host "Test 3: GET /users/profile (Protected)" -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        $profileResponse = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✓ Status: 200 OK" -ForegroundColor Green
        Write-Host "  Profile: $($profileResponse.data.user.fullName)" -ForegroundColor Gray
        $testResults += @{Test="GET /users/profile"; Status="PASS"}
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test="GET /users/profile"; Status="FAIL"}
    }
    Write-Host ""
}

# Test 4: Get Students (Admin only)
if ($token) {
    Write-Host "Test 4: GET /users/students (Admin Only)" -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        $studentsResponse = Invoke-RestMethod -Uri "$baseUrl/users/students" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✓ Status: 200 OK" -ForegroundColor Green
        Write-Host "  Students found: $($studentsResponse.data.students.Count)" -ForegroundColor Gray
        $testResults += @{Test="GET /users/students"; Status="PASS"}
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test="GET /users/students"; Status="FAIL"}
    }
    Write-Host ""
}

# Test 5: Get Batches
Write-Host "Test 5: GET /lms/batches" -ForegroundColor Yellow
try {
    $batchesResponse = Invoke-RestMethod -Uri "$baseUrl/lms/batches" -Method GET -ErrorAction Stop
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    Write-Host "  Batches found: $($batchesResponse.data.batches.Count)" -ForegroundColor Gray
    $testResults += @{Test="GET /lms/batches"; Status="PASS"}
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test="GET /lms/batches"; Status="FAIL"}
}
Write-Host ""

# Test 6: Get Admin Stats (Admin only)
if ($token) {
    Write-Host "Test 6: GET /admin/stats/overview (Admin Only)" -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $token"
        }
        $statsResponse = Invoke-RestMethod -Uri "$baseUrl/admin/stats/overview" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✓ Status: 200 OK" -ForegroundColor Green
        Write-Host "  Total Users: $($statsResponse.data.stats.totalUsers)" -ForegroundColor Gray
        Write-Host "  Total Courses: $($statsResponse.data.stats.totalCourses)" -ForegroundColor Gray
        $testResults += @{Test="GET /admin/stats/overview"; Status="PASS"}
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test="GET /admin/stats/overview"; Status="FAIL"}
    }
    Write-Host ""
}

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "Passed: $passed/$total" -ForegroundColor Green
Write-Host "Failed: $failed/$total" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✓ All tests passed! API is working correctly." -ForegroundColor Green
} else {
    Write-Host "✗ Some tests failed. Check the output above." -ForegroundColor Red
}

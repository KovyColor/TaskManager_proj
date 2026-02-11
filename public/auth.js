// API Base Configuration - use relative paths for production compatibility
const AUTH_API = "/api/auth";

/**
 * Login user
 * - POST to /api/auth/login
 * - Save token and role to localStorage
 * - Redirect to dashboard
 */
async function loginUser() {
  console.log('🚀 loginUser() called!');
  const email = document.getElementById('email')?.value?.trim();
  const password = document.getElementById('password')?.value?.trim();

  console.log('📧 Email:', email);
  console.log('🔓 Password length:', password?.length);

  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    console.log('📤 Sending login request to:', AUTH_API + '/login');
    const res = await fetch(AUTH_API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    console.log('✅ Response received. Status:', res.status, 'OK:', res.ok);

    // Check response status before parsing JSON
    if (!res.ok) {
      const text = await res.text();
      console.log('❌ Error response text:', text);
      const data = text ? JSON.parse(text) : { error: 'Invalid credentials' };
      alert('Login failed: ' + (data.error || 'Invalid credentials'));
      return;
    }

    const data = await res.json();
    console.log('📥 Backend response object:', data);
    console.log('   Response keys:', Object.keys(data));
    console.log('   data.token exists?', !!data.token);
    console.log('   data.role value:', data.role);
    console.log('   data.role type:', typeof data.role);

    if (data.token) {
      const roleToStore = data.role || 'user';
      console.log('🔵 Before saving - roleToStore:', roleToStore);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', roleToStore);
      console.log('🟢 After saving - role in localStorage:', localStorage.getItem('role'));
      console.log('✅ Login successful!');
      console.log('   Token:', data.token.substring(0, 20) + '...');
      console.log('   Role from backend:', data.role);
      console.log('   Stored role:', localStorage.getItem('role'));
      // Wait a bit before redirect to ensure localStorage is written
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 100);
    } else {
      alert('Login failed: ' + (data.error || 'Invalid credentials'));
    }
  } catch (err) {
    alert('Error logging in: ' + err.message);
  }
}

/**
 * Register new user
 * - POST to /api/auth/register
 * - Default role is "user"
 * - On success, redirect to login page
 */
async function registerUser() {
  const email = document.getElementById('email')?.value?.trim();
  const password = document.getElementById('password')?.value?.trim();
  const confirmPassword = document.getElementById('confirmPassword')?.value?.trim();

  if (!email || !password || !confirmPassword) {
    alert('Please fill in all fields');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  try {
    const res = await fetch(AUTH_API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password, 
        role: 'user'  // Default role
      })
    });

    // Check response status before parsing JSON
    if (!res.ok) {
      const text = await res.text();
      const data = text ? JSON.parse(text) : { error: 'Unknown error' };
      alert('Registration failed: ' + (data.error || 'Unknown error'));
      return;
    }

    const data = await res.json();

    if (data.user || data.message === 'User registered successfully') {
      alert('Registration successful! Please log in.');
      window.location.href = '/login.html';
    } else {
      alert('Registration failed: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Error registering: ' + err.message);
  }
}

/**
 * Logout user
 * - Remove token and role from localStorage
 * - Redirect to login page
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/login.html';
}

/**
 * Check if user is authenticated
 * - Returns true if token exists in localStorage
 * - Returns false otherwise
 */
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

/**
 * Get user role from localStorage
 * - Returns role (e.g., 'admin', 'user')
 * - Returns 'user' as default if not set
 */
function getUserRole() {
  return localStorage.getItem('role') || 'user';
}

/**
 * Check authentication and redirect if needed
 * - If no token, redirect to login page
 * - Call this at top of every protected page
 */
function checkAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
  }
}

/**
 * Check if user is admin
 * - Returns true if role is 'admin'
 */
function isAdmin() {
  return getUserRole() === 'admin';
}

/**
 * Hide/show sidebar items based on user role
 * - Admin: show "Employees" and "Reports"
 * - User: hide "Employees" and "Reports"
 * - Called from app.js DOMContentLoaded
 */
function applyRoleBasedVisibility() {
  const role = getUserRole();
  const employeesButton = document.querySelector('[data-view="employees"]');
  const reportsButton = document.querySelector('[data-view="reports"]');

  if (!employeesButton || !reportsButton) {
    console.warn('Sidebar buttons not found');
    return;
  }

  if (role === 'admin') {
    // Show for admin
    employeesButton.style.display = 'block';
    reportsButton.style.display = 'block';
  } else {
    // Hide for user
    employeesButton.style.display = 'none';
    reportsButton.style.display = 'none';
  }
}

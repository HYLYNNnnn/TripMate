import axios from "axios";

const API_BASE = (process.env.REACT_APP_API_BASE || "/api").replace(/\/+$/, "");

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  const message = data?.message || data?.error?.message || data?.error;
  return typeof message === "string" && message.trim() ? message : fallback;
};

// Token management
export const getAuthToken = () => localStorage.getItem('authToken');
export const setAuthToken = (token) => localStorage.setItem('authToken', token);
export const removeAuthToken = () => localStorage.removeItem('authToken');

// Decode JWT to get user info
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded.exp !== "number" || !Number.isFinite(decoded.exp)) return true;
  return Date.now() >= decoded.exp * 1000;
};

// Login function
export async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Try different possible token field names
    const token = response.data.token || 
                  response.data.accessToken || 
                  response.data.access_token || 
                  response.data.jwt ||
                  response.data.data?.token;
    
    const user = typeof token === "string" ? decodeToken(token) : null;
    if (!user || isTokenExpired(token)) {
      removeAuthToken();
      return { success: false, message: "The server returned an invalid or expired sign-in token." };
    }

    setAuthToken(token);
    return { success: true, user };
  } catch (error) {
    return { 
      success: false, 
      message: getErrorMessage(error, 'Login failed') 
    };
  }
}

// Register function
export async function register(userData) {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: getErrorMessage(error, 'Registration failed') 
    };
  }
}

// Logout function
export function logout() {
  removeAuthToken();
  // Clear any other user-related data from localStorage if needed
  localStorage.removeItem('userProfile');
  window.location.href = '/';
}

// Get current user from token
export function getCurrentUser() {
  const token = getAuthToken();
  if (!token || isTokenExpired(token)) {
    removeAuthToken();
    return null;
  }
  return decodeToken(token);
}

// Auth state watcher (simulates Firebase's onAuthStateChanged)
export function watchAuth(callback) {
  // Initial check
  const currentUser = getCurrentUser();
  callback(currentUser);

  // Set up periodic token validation
  const interval = setInterval(() => {
    const user = getCurrentUser();
    callback(user);
  }, 60000); // Check every minute

  // Return cleanup function
  return () => clearInterval(interval);
}

// Password reset functions
export async function forgotPassword(email) {
  try {
    const response = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
    return { success: true, message: response.data.message };
  } catch (error) {
    return { 
      success: false, 
      message: getErrorMessage(error, 'Failed to send reset email') 
    };
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const response = await axios.post(`${API_BASE}/auth/reset-password`, {
      token,
      newPassword
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    return { 
      success: false, 
      message: getErrorMessage(error, 'Password reset failed') 
    };
  }
}

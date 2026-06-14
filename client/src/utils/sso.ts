/**
 * SSO Integration with Main System (Sales Mission Manager)
 */

const MAIN_SYSTEM_API = import.meta.env.VITE_MAIN_SYSTEM_API || 'http://localhost:2001/api';
const MAIN_SYSTEM_URL = import.meta.env.VITE_MAIN_SYSTEM_URL || 'http://localhost:2000';

export interface SSOUser {
  id: number;
  name: string;
  username: string;
  role: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface SSOVerificationResult {
  valid: boolean;
  user?: SSOUser;
  expiresAt?: string;
  message?: string;
}

/**
 * Get token from localStorage
 */
export function getSSOToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

/**
 * Verify token with main system
 */
export async function verifySSOToken(token: string): Promise<SSOVerificationResult> {
  try {
    const response = await fetch(`${MAIN_SYSTEM_API}/auth/verify?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.valid && data.user) {
      return {
        valid: true,
        user: data.user,
        expiresAt: data.expiresAt
      };
    }

    return {
      valid: false,
      message: data.message || 'Token verification failed'
    };
  } catch (error) {
    console.error('Error verifying SSO token:', error);
    return {
      valid: false,
      message: 'Failed to connect to main system'
    };
  }
}

/**
 * Check if user is authenticated via SSO
 */
export async function checkSSOAuth(): Promise<{ authenticated: boolean; user?: SSOUser }> {
  const token = getSSOToken();
  if (!token) {
    return { authenticated: false };
  }

  const verification = await verifySSOToken(token);
  if (verification.valid && verification.user) {
    return {
      authenticated: true,
      user: verification.user
    };
  }

  // Token invalid, remove it
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }

  return { authenticated: false };
}

/**
 * Redirect to main system login
 */
export function redirectToMainLogin() {
  if (typeof window !== 'undefined') {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `${MAIN_SYSTEM_URL}/login?redirect=${currentUrl}`;
  }
}

/**
 * Handle SSO login redirect
 */
export function handleSSORedirect() {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const redirect = urlParams.get('redirect');

    if (token) {
      // Store token
      localStorage.setItem('token', token);
      
      // Clean URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      newUrl.searchParams.delete('redirect');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Redirect to original destination or dashboard
      if (redirect) {
        window.location.href = redirect;
      } else {
        window.location.href = '/';
      }
    }
  }
}


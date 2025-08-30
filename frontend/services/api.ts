import { authService } from './authService';

const getApiBaseUrl = () => {
    // All API calls should be relative to the current domain.
    // The web server (e.g., Nginx) is responsible for proxying any requests
    // under /api to the backend service running on its configured port (e.g., 4000).
    // This removes the need for complex logic to detect the environment (local, prod, codespace).
    return '/api';
};

const API_BASE_URL = getApiBaseUrl();

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (response.status === 204) { // No Content
        return {} as T;
    }
    
    const data = await response.json().catch(() => {
        // Handle cases where response is not JSON, but still an error
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        return {}; // Or null, depending on how you want to handle non-JSON success responses
    });

    if (!response.ok) {
        // If the server sends a 401 Unauthorized, log the user out.
        if (response.status === 401 && window.location.pathname !== '/') {
            authService.logout();
            window.location.href = '/'; // Redirect to login
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
};


const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = authService.getToken();
    const headers = new Headers(options.headers || {});
    
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return handleResponse<T>(response);
};


export const api = {
    get: <T>(endpoint: string): Promise<T> => {
        return request<T>(endpoint);
    },
    post: <T>(endpoint: string, body: any): Promise<T> => {
        return request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
    },
    put: <T>(endpoint: string, body: any): Promise<T> => {
        return request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
    },
    delete: <T>(endpoint: string): Promise<T> => {
        return request<T>(endpoint, { method: 'DELETE' });
    },
};
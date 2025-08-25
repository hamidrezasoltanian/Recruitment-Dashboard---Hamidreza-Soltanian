import { authService } from './authService';

const getApiBaseUrl = () => {
    const { protocol, hostname } = window.location;

    // Handle sandboxed environments where protocol is 'blob:' and hostname is empty.
    // Fallback to localhost, as it's often forwarded correctly.
    if (protocol === 'blob:') {
        return 'http://localhost:4000/api';
    }

    // Handle standard local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${window.location.protocol}//${hostname}:4000/api`;
    }
    
    // Handle cloud IDEs by reconstructing the origin with the backend port
    try {
        const url = new URL(window.location.origin);
        url.port = '4000';
        return `${url.origin}/api`;
    } catch (e) {
        // Fallback for any other case
        return `${protocol}//${hostname}:4000/api`;
    }
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
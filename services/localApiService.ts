import { Candidate } from '../types';

// Always use relative URLs — frontend is always served by the same Express server
const API_BASE = '';
const TOKEN_KEY = 'local_api_token';

const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

const apiFetch = async (path: string, opts?: RequestInit): Promise<any> => {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// ── Server Detection ────────────────────────────────────────────────────────

let _detected: boolean | null = null;

export const detectLocalServer = async (): Promise<boolean> => {
  if (_detected !== null) return _detected;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);
    _detected = res.ok;
  } catch {
    _detected = false;
  }
  return _detected;
};

export const isLocalServerMode = () => _detected === true;

// ── Auth ────────────────────────────────────────────────────────────────────

export const localApiAuth = {
  login: async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token);
    return data.user as { id: string; email: string; name: string; isAdmin: boolean; companyId: string };
  },

  register: async (companyName: string, userName: string, email: string, password: string) => {
    const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ companyName, userName, email, password }) });
    setToken(data.token);
    return data.user as { id: string; email: string; name: string; isAdmin: boolean; companyId: string };
  },

  me: async () => {
    const data = await apiFetch('/auth/me');
    return data.user as { id: string; email: string; name: string; isAdmin: boolean; companyId: string } | null;
  },

  logout: () => clearToken(),

  listUsers: async () => apiFetch('/auth/users') as Promise<{ id: string; email: string; name: string; isAdmin: boolean }[]>,

  addUser: async (user: { email: string; name: string; password: string; isAdmin: boolean }) =>
    apiFetch('/auth/users', { method: 'POST', body: JSON.stringify(user) }),

  deleteUser: async (id: string) =>
    apiFetch(`/auth/users/${id}`, { method: 'DELETE' }),
};

// ── Candidates ──────────────────────────────────────────────────────────────

export const localApiCandidates = {
  getAll: (): Promise<Candidate[]> => apiFetch('/candidates'),

  save: (candidate: Candidate): Promise<void> =>
    apiFetch('/candidates', { method: 'POST', body: JSON.stringify(candidate) }),

  delete: (id: string): Promise<void> =>
    apiFetch(`/candidates/${id}`, { method: 'DELETE' }),

  deleteAll: (): Promise<void> =>
    apiFetch('/candidates', { method: 'DELETE' }),

  bulkSave: (candidates: Candidate[]): Promise<{ count: number }> =>
    apiFetch('/candidates/bulk', { method: 'POST', body: JSON.stringify(candidates) }),
};

// ── Files ───────────────────────────────────────────────────────────────────

const fileHeaders = () => ({ 'Authorization': `Bearer ${getToken()}` });

export const localApiFiles = {
  uploadResume: async (candidateId: string, file: File): Promise<void> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/resume`, {
      method: 'POST',
      headers: fileHeaders(),
      body: fd,
    });
    if (!res.ok) throw new Error('Failed to upload resume');
  },

  getResume: async (candidateId: string): Promise<File | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/resume`, { headers: fileHeaders() });
      if (!res.ok) return null;
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const filename = cd.match(/filename="?([^"]+)"?/)?.[1] || 'resume.pdf';
      return new File([blob], decodeURIComponent(filename), { type: blob.type });
    } catch {
      return null;
    }
  },

  deleteResume: async (candidateId: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/api/candidates/${candidateId}/resume`, { method: 'DELETE', headers: fileHeaders() });
    } catch { /* ignore */ }
  },

  uploadTestFile: async (candidateId: string, testId: string, file: File): Promise<void> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/testfile/${testId}`, {
      method: 'POST',
      headers: fileHeaders(),
      body: fd,
    });
    if (!res.ok) throw new Error('Failed to upload test file');
  },

  getTestFile: async (candidateId: string, testId: string): Promise<File | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/testfile/${testId}`, { headers: fileHeaders() });
      if (!res.ok) return null;
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const filename = cd.match(/filename="?([^"]+)"?/)?.[1] || 'file';
      return new File([blob], decodeURIComponent(filename), { type: blob.type });
    } catch {
      return null;
    }
  },
};

// ── Settings ────────────────────────────────────────────────────────────────

export const localApiSettings = {
  load: (): Promise<any> => apiFetch('/settings'),
  save: (partial: object): Promise<void> =>
    apiFetch('/settings', { method: 'PATCH', body: JSON.stringify(partial) }),
};

// ── Import ──────────────────────────────────────────────────────────────────

export const localApiImport = {
  parseCSV: async (file: File): Promise<{ headers: string[]; rows: Record<string, string>[]; total: number }> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/api/import/csv`, { method: 'POST', headers: fileHeaders(), body: fd });
    if (!res.ok) throw new Error('CSV parse failed');
    return res.json();
  },

  parseResume: async (file: File): Promise<{ extracted: { name: string; email: string; phone: string }; textPreview: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/api/import/resume-parse`, { method: 'POST', headers: fileHeaders(), body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Parse failed' }));
      throw new Error(err.error);
    }
    return res.json();
  },

  getEmailConfig: (): Promise<any> => apiFetch('/import/email-config'),
  saveEmailConfig: (config: object): Promise<void> =>
    apiFetch('/import/email-config', { method: 'POST', body: JSON.stringify(config) }),
  testEmailConnection: (config: object): Promise<{ success: boolean; message?: string; error?: string }> =>
    apiFetch('/import/email-config/test', { method: 'POST', body: JSON.stringify(config) }),
};

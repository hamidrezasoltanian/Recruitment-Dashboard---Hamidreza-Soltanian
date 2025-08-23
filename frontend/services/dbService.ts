import { Candidate } from '../types';

const API_BASE_URL = 'http://localhost:4000/api';

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Invalid JSON response' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) { // No Content
        return {} as T;
    }
    return response.json();
};

export const dbService = {
  createCandidate: async (candidate: Candidate): Promise<Candidate> => {
    const response = await fetch(`${API_BASE_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
    });
    return handleResponse<Candidate>(response);
  },
  
  updateCandidate: async (candidate: Candidate): Promise<Candidate> => {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
    });
    return handleResponse<Candidate>(response);
  },

  getAllCandidates: async (): Promise<Candidate[]> => {
    const response = await fetch(`${API_BASE_URL}/candidates`);
    return handleResponse<Candidate[]>(response);
  },

  getCandidate: async (id: string): Promise<Candidate> => {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`);
    return handleResponse<Candidate>(response);
  },

  deleteCandidate: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
  
  // The backend doesn't support file uploads yet. These are no-ops for now.
  // Implementing file handling requires backend changes (e.g., using multer with Express).
  saveResume: async (id: string, file: File): Promise<void> => {
    console.warn('saveResume: File uploads to backend not implemented.');
    return Promise.resolve();
  },
  getResume: async (id: string): Promise<File | null> => {
    console.warn('getResume: File downloads from backend not implemented.');
    try {
        const candidate = await dbService.getCandidate(id);
        if (!candidate.hasResume) return null;
        // This is just a placeholder to avoid breaking the UI.
        return new File(["(فایل در بک‌اند ذخیره نشده)"], "resume_placeholder.pdf", { type: "application/pdf" });
    } catch {
        return null;
    }
  },
  deleteResume: async (id: string): Promise<void> => {
    console.warn('deleteResume: File deletion on backend not implemented.');
    return Promise.resolve();
  },
  saveTestFile: async (id: string, file: File): Promise<void> => {
      console.warn('saveTestFile: Not implemented for backend.');
      return Promise.resolve();
  },
  getTestFile: async (id: string): Promise<File | null> => {
      console.warn('getTestFile: Not implemented for backend.');
      return Promise.resolve(null);
  },
  deleteTestFile: async (id: string): Promise<void> => {
      console.warn('deleteTestFile: Not implemented for backend.');
      return Promise.resolve();
  },
};

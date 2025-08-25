import { Candidate } from '../types';
import { api } from './api';

export const dbService = {
  createCandidate: (candidate: Candidate): Promise<Candidate> => {
    return api.post<Candidate>('/candidates', candidate);
  },
  
  updateCandidate: (candidate: Candidate): Promise<Candidate> => {
    return api.put<Candidate>(`/candidates/${candidate.id}`, candidate);
  },

  getAllCandidates: (): Promise<Candidate[]> => {
    return api.get<Candidate[]>('/candidates');
  },

  getCandidate: (id: string): Promise<Candidate> => {
    return api.get<Candidate>(`/candidates/${id}`);
  },

  deleteCandidate: (id: string): Promise<void> => {
    return api.delete<void>(`/candidates/${id}`);
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

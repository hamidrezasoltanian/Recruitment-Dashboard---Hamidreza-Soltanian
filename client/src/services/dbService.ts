import { Candidate } from '../types';

// Use localStorage for data storage (no API calls)
// Check if override is available (for HTML mode)
const getDbService = () => {
  if (typeof window !== 'undefined' && (window as any).dbServiceOverride) {
    return (window as any).dbServiceOverride;
  }
  return {
  async getAllCandidates(): Promise<Candidate[]> {
    try {
      const stored = localStorage.getItem('candidates');
      const candidates = stored ? JSON.parse(stored) : [];
      console.log('Loaded candidates from localStorage:', candidates.length);
      return candidates;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  },

  async saveCandidate(candidate: Candidate): Promise<void> {
    try {
      const existing = await this.getAllCandidates();
      const updated = existing.filter(c => c.id !== candidate.id);
      updated.push(candidate);
      localStorage.setItem('candidates', JSON.stringify(updated));
      console.log('Candidate saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  },

  async updateCandidate(candidate: Candidate): Promise<void> {
    try {
      const existing = await this.getAllCandidates();
      const updated = existing.map(c => c.id === candidate.id ? candidate : c);
      localStorage.setItem('candidates', JSON.stringify(updated));
      console.log('Candidate updated in localStorage');
    } catch (error) {
      console.error('Error updating in localStorage:', error);
      throw error;
    }
  },

  async deleteCandidate(id: string): Promise<void> {
    try {
      const existing = await this.getAllCandidates();
      const updated = existing.filter(c => c.id !== id);
      localStorage.setItem('candidates', JSON.stringify(updated));
      console.log('Candidate deleted from localStorage');
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      throw error;
    }
  },

  async saveResume(candidateId: string, file: File): Promise<string> {
    try {
      // Convert file to base64 and store in localStorage
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          const resumeKey = `resume_${candidateId}`;
          localStorage.setItem(resumeKey, base64);
          console.log('Resume saved for candidate:', candidateId);
          resolve(`resume-${candidateId}.${file.name.split('.').pop()}`);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error saving resume:', error);
      throw error;
    }
  },

  async getResume(candidateId: string): Promise<Blob | null> {
    try {
      const resumeKey = `resume_${candidateId}`;
      const base64 = localStorage.getItem(resumeKey);
      if (!base64) {
        console.log('No resume found for candidate:', candidateId);
        return null;
      }
      
      // Convert base64 back to Blob
      const response = await fetch(base64);
      const blob = await response.blob();
      console.log('Resume retrieved for candidate:', candidateId);
      return blob;
    } catch (error) {
      console.error('Error retrieving resume:', error);
      return null;
    }
  },

  async saveTestFile(candidateId: string, testId: string, file: File): Promise<string> {
    // For now, just simulate saving test file
    console.log('Test file saving simulated for candidate:', candidateId, 'test:', testId);
    return `simulated-test-${candidateId}-${testId}.pdf`;
  },

  async getTestFile(candidateId: string, testId: string): Promise<Blob | null> {
    // For now, return null since we're not actually saving files
    console.log('Test file retrieval simulated for candidate:', candidateId, 'test:', testId);
    return null;
  },

  async exportData(): Promise<Blob> {
    // Export data from localStorage
    try {
      const candidates = await this.getAllCandidates();
      const data = JSON.stringify(candidates, null, 2);
      return new Blob([data], { type: 'application/json' });
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  async importData(file: File): Promise<void> {
    // Import data to localStorage
    try {
      const text = await file.text();
      const candidates = JSON.parse(text);
      localStorage.setItem('candidates', JSON.stringify(candidates));
      console.log('Data imported to localStorage');
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  // Additional methods for compatibility
  async clearAllCandidates(): Promise<void> {
    localStorage.removeItem('candidates');
    console.log('All candidates cleared from localStorage');
  },

  async clearAllResumes(): Promise<void> {
    try {
      // Remove all resume keys from localStorage
      const keys = Object.keys(localStorage);
      const resumeKeys = keys.filter(key => key.startsWith('resume_'));
      resumeKeys.forEach(key => localStorage.removeItem(key));
      console.log('All resumes cleared from localStorage');
    } catch (error) {
      console.error('Error clearing resumes:', error);
      throw error;
    }
  },

  async deleteResume(candidateId: string): Promise<void> {
    try {
      const resumeKey = `resume_${candidateId}`;
      localStorage.removeItem(resumeKey);
      console.log('Resume deleted for candidate:', candidateId);
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw error;
    }
  },

  async deleteTestFile(candidateId: string, testId: string): Promise<void> {
    // For now, just log since we're not actually saving files
    console.log('Test file deletion simulated for candidate:', candidateId, 'test:', testId);
  }
  };
};

export const dbService = getDbService();
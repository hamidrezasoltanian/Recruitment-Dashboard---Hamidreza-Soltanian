import { 
  Candidate, 
  User, 
  Comment, 
  HistoryEntry, 
  KanbanStage, 
  Template, 
  CompanyProfile, 
  TestLibraryItem, 
  ApiResponse 
} from '../types';

const API_BASE_URL = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'خطا در ارتباط با سرور');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.data) {
      this.token = response.data.token;
      localStorage.setItem('authToken', response.data.token);
    }

    return response.data!;
  }

  async register(userData: { username: string; name: string; password: string; isAdmin?: boolean }): Promise<User> {
    const response = await this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response.data!;
  }

  async getProfile(): Promise<User> {
    const response = await this.request<User>('/auth/profile');
    return response.data!;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Candidate methods
  async getCandidates(filters?: {
    search?: string;
    position?: string;
    source?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Candidate[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const response = await this.request<Candidate[]>(`/candidates?${params.toString()}`);
    return response.data!;
  }

  async getCandidateById(id: string): Promise<Candidate> {
    const response = await this.request<Candidate>(`/candidates/${id}`);
    return response.data!;
  }

  async createCandidate(candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'user' | 'comments' | 'history' | 'testResults' | 'resumeFiles' | 'testFiles'>): Promise<Candidate> {
    const response = await this.request<Candidate>('/candidates', {
      method: 'POST',
      body: JSON.stringify(candidate),
    });

    return response.data!;
  }

  async updateCandidate(id: string, candidate: Partial<Candidate>): Promise<Candidate> {
    const response = await this.request<Candidate>(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(candidate),
    });

    return response.data!;
  }

  async deleteCandidate(id: string): Promise<void> {
    await this.request(`/candidates/${id}`, {
      method: 'DELETE',
    });
  }

  async updateCandidateStage(id: string, newStage: string): Promise<Candidate> {
    const response = await this.request<Candidate>(`/candidates/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ newStage }),
    });

    return response.data!;
  }

  // Comment methods
  async addComment(candidateId: string, text: string): Promise<Comment> {
    const response = await this.request<Comment>(`/comments/candidates/${candidateId}`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    return response.data!;
  }

  async getComments(candidateId: string): Promise<Comment[]> {
    const response = await this.request<Comment[]>(`/comments/candidates/${candidateId}`);
    return response.data!;
  }

  async updateComment(commentId: string, text: string): Promise<Comment> {
    const response = await this.request<Comment>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    });

    return response.data!;
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async addHistoryEntry(candidateId: string, action: string, details?: string): Promise<HistoryEntry> {
    const response = await this.request<HistoryEntry>(`/comments/candidates/${candidateId}/history`, {
      method: 'POST',
      body: JSON.stringify({ action, details }),
    });

    return response.data!;
  }

  // Stage methods
  async getStages(): Promise<KanbanStage[]> {
    const response = await this.request<KanbanStage[]>('/stages');
    return response.data!;
  }

  async createStage(stage: Omit<KanbanStage, 'id' | 'createdAt' | 'updatedAt'>): Promise<KanbanStage> {
    const response = await this.request<KanbanStage>('/stages', {
      method: 'POST',
      body: JSON.stringify(stage),
    });

    return response.data!;
  }

  async updateStage(id: string, stage: Partial<KanbanStage>): Promise<KanbanStage> {
    const response = await this.request<KanbanStage>(`/stages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stage),
    });

    return response.data!;
  }

  async deleteStage(id: string): Promise<void> {
    await this.request(`/stages/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderStages(stages: { id: string; order: number }[]): Promise<KanbanStage[]> {
    const response = await this.request<KanbanStage[]>('/stages/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ stages }),
    });

    return response.data!;
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    const response = await this.request<Template[]>('/templates');
    return response.data!;
  }

  async getTemplateById(id: string): Promise<Template> {
    const response = await this.request<Template>(`/templates/${id}`);
    return response.data!;
  }

  async createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> {
    const response = await this.request<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });

    return response.data!;
  }

  async updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
    const response = await this.request<Template>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });

    return response.data!;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.request(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings methods
  async getCompanyProfile(): Promise<CompanyProfile> {
    const response = await this.request<CompanyProfile>('/settings/company-profile');
    return response.data!;
  }

  async updateCompanyProfile(profile: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const response = await this.request<CompanyProfile>('/settings/company-profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });

    return response.data!;
  }

  // Job position methods
  async addJobPosition(title: string): Promise<any> {
    const response = await this.request<any>('/settings/job-positions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    return response.data!;
  }

  async updateJobPosition(id: string, title: string): Promise<any> {
    const response = await this.request<any>(`/settings/job-positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
    return response.data!;
  }

  async deleteJobPosition(id: string): Promise<void> {
    await this.request(`/settings/job-positions/${id}`, { method: 'DELETE' });
  }

  async getSources(): Promise<any[]> {
    const response = await this.request<any[]>('/settings/sources');
    return response.data!;
  }

  async addSource(name: string): Promise<any> {
    const response = await this.request<any>('/settings/sources', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    return response.data!;
  }

  async deleteSource(id: string): Promise<void> {
    await this.request(`/settings/sources/${id}`, {
      method: 'DELETE',
    });
  }

  async getTestLibrary(): Promise<TestLibraryItem[]> {
    const response = await this.request<TestLibraryItem[]>('/settings/test-library');
    return response.data!;
  }

  async addTestLibraryItem(item: Omit<TestLibraryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestLibraryItem> {
    const response = await this.request<TestLibraryItem>('/settings/test-library', {
      method: 'POST',
      body: JSON.stringify(item),
    });

    return response.data!;
  }

  async updateTestLibraryItem(id: string, item: Partial<TestLibraryItem>): Promise<TestLibraryItem> {
    const response = await this.request<TestLibraryItem>(`/settings/test-library/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });

    return response.data!;
  }

  async deleteTestLibraryItem(id: string): Promise<void> {
    await this.request(`/settings/test-library/${id}`, {
      method: 'DELETE',
    });
  }

  // File upload methods
  async uploadResume(candidateId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/files/resume/${candidateId}`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'خطا در آپلود رزومه');
    }

    return response.json();
  }

  async downloadResume(candidateId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/files/resume/${candidateId}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'خطا در دانلود رزومه');
    }

    return response.blob();
  }

  async deleteResume(candidateId: string): Promise<void> {
    await this.request(`/files/resume/${candidateId}`, {
      method: 'DELETE',
    });
  }

  async uploadTestFile(candidateId: string, testId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('testFile', file);

    const response = await fetch(`${API_BASE_URL}/files/test/${candidateId}/${testId}`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'خطا در آپلود فایل آزمون');
    }

    return response.json();
  }

  async downloadTestFile(candidateId: string, testId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/files/test/${candidateId}/${testId}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'خطا در دانلود فایل آزمون');
    }

    return response.blob();
  }

  async deleteTestFile(candidateId: string, testId: string): Promise<void> {
    await this.request(`/files/test/${candidateId}/${testId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();


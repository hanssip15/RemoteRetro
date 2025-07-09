
const API_BASE_URL = '/api';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Retro {
  id: string;
  title: string;
  format: string;
  status: string;
  createdAt: string;
}

export interface RetroFormat {
  name: string;
}


export interface RetroItem {
  id: string;
  retroId: string;
  category: string;
  content: string;
  author?: string;
  createdBy?: string;
  createdAt: string;
}

export interface UpdateRetroData {
  status: string;
}

export interface UpdateParticipantRoleData {
  role: boolean;
}

export interface Participant {
  id: number;
  retroId: string;
  role: boolean;
  joinedAt: Date;
  user: User;
}

export interface CreateRetroData {
  title: string;
  format: string;
}

export interface CreateItemData {
  category: string;
  content: string;
  author?: string;
  created_by?: string;
}

export interface UpdateItemData {
  content: string;
  author?: string;
  userId?: string;
}

export interface addParticipantData {
  role: boolean;
  userId: string;
}

class ApiService {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    console.log('API request to:', url);
    console.log('Token present:', !!token);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Making request with config:', config);
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          // Clear invalid session data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          throw new Error('Authentication failed. Please login again.');
        }
        
        // Handle server errors
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        // Handle client errors
        if (response.status >= 400) {
          throw new Error(`Request failed: ${response.status}`);
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Retro endpoints
  async getRetros(): Promise<Retro[]> {
    return this.request<Retro[]>('/retros');
  }

  // async getRetro(id: string): Promise<{ retro: Retro; items: RetroItem[]; participants: Participant[] }> {
  //   return this.request<{ retro: Retro; items: RetroItem[]; participants: Participant[] }>(`/retros/${id}`);
  // }

  async getRetro(id: string): Promise<{ retro: Retro; participants: Participant[] }> {
    return this.request<{ retro: Retro; participants: Participant[] }>(`/retros/${id}`);
  }

  

  async createRetro(data: CreateRetroData): Promise<Retro> {
    const result = await this.request<Retro>('/retros', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  }

  async getItems(retroId: string): Promise<RetroItem[]> {
    return this.request<RetroItem[]>(`/retros/${retroId}/items`);
  }

  async getItem(retroId: string, itemId: string): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items/${itemId}`);
  }

  async createItem(retroId: string, data: CreateItemData): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(retroId: string, itemId: string, data: UpdateItemData): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(retroId: string, itemId: string): Promise<{ success: boolean; message: string; itemId: string }> {
    return this.request<{ success: boolean; message: string; itemId: string }>(`/retros/${retroId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async voteItem(retroId: string, itemId: string): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items/${itemId}/vote`, {
      method: 'POST',
    });
  }

  // Participant endpoints
  async getParticipants(retroId: number): Promise<Participant[]> {
    return this.request<Participant[]>(`/retros/${retroId}/participants`);
  }
  async addParticipant(retroId: string, data: addParticipantData): Promise<Participant> {
    return this.request<Participant>(`/participant/${retroId}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateParticipantRole(retroId: string, participantId: number): Promise<Participant> {
    return this.request<Participant>(`/participant/${retroId}/update-role/${participantId}`, {
      method: 'PUT'
    });
  }

  async updateRetro(retroId: string, data: UpdateRetroData): Promise<Retro> {
    console.log("=== UPDATE RETRO ===", data)
    console.log("=== RETRO ID ===", retroId)
    return this.request<Retro>(`/retros/${retroId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  async removeParticipant(retroId: number, participantId: number): Promise<void> {
    return this.request<void>(`/retros/${retroId}/participants/${participantId}`, {
      method: 'DELETE',
    });
  }

  // Dashboard endpoints
  async getDashboardRetros(page = 1, limit = 3): Promise<{
    retros: Retro[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    return this.request(`/dashboard/retros?page=${page}&limit=${limit}`);
  }

  async getDashboardStats(): Promise<{
    totalRetros: number;
    uniqueMembers: number;
    actionItems: {
      total: number;
      completed: number;
    };
  }> {
    return this.request('/dashboard/stats');
  }
}
// api.ts
export const fetchProtectedData = async () => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch('http://localhost:3001/protected-route', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Not authorized');
  return await res.json();
};

export const apiService = new ApiService();

export const api = {
  // Get current user info from session
  getCurrentUser: async (): Promise<any> => {
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      throw new Error('No user data found in session');
    }
    return JSON.parse(userData);
  },

  // Set auth token and user data
  setAuthToken: (token: string, userData?: any) => {
    console.log('Setting auth token:', token.substring(0, 50) + '...');
    localStorage.setItem('auth_token', token);
    console.log('Auth token stored in localStorage');
    
    if (userData) {
      console.log('Setting user data in session:', userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
  },

  // Remove auth token and user data (logout)
  removeAuthToken: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!(localStorage.getItem('auth_token') && localStorage.getItem('user_data'));
  },

  // Set user data in session
  setUserData: (userData: any) => {
    console.log('Setting user data in session:', userData);
    localStorage.setItem('user_data', JSON.stringify(userData));
  }
}; 

const API_BASE_URL = '/api';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Retro {
  id: string;
  title: string;
  description?: string;
  teamSize?: number;
  duration: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}


export interface RetroItem {
  id: number;
  retroId: string;
  category: string;
  content: string;
  author?: string;
  votes: number;
  createdAt: string;
}

export interface Participant {
  id: number;
  retroId: number;
  name: string;
  role: string;
  joinedAt: string;
}

export interface CreateRetroData {
  title: string;
}

export interface UpdateRetroData {
  title?: string;
  description?: string;
  status?: string;
}

export interface CreateItemData {
  category: string;
  content: string;
  author?: string;
}

export interface UpdateItemData {
  content?: string;
  author?: string;
}

export interface JoinRetroData {
  name: string;
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

  async getRetro(id: string): Promise<{ retro: Retro; items: RetroItem[]; participants: Participant[] }> {
    return this.request<{ retro: Retro; items: RetroItem[]; participants: Participant[] }>(`/retros/${id}`);
  }

  async createRetro(data: CreateRetroData): Promise<Retro> {
    console.log('🎯 === FRONTEND CREATE RETRO DEBUG ===');
    console.log('📝 Creating retro with data:', JSON.stringify(data, null, 2));
    console.log('🔗 Endpoint: /retros');
    console.log('📤 Method: POST');
    
    const result = await this.request<Retro>('/retros', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log('✅ Retro created successfully:', JSON.stringify(result, null, 2));
    return result;
  }

  async updateRetro(id: number, data: UpdateRetroData): Promise<Retro> {
    return this.request<Retro>(`/retros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRetro(id: number): Promise<void> {
    return this.request<void>(`/retros/${id}`, {
      method: 'DELETE',
    });
  }

  // Item endpoints
  async getItems(retroId: number): Promise<RetroItem[]> {
    return this.request<RetroItem[]>(`/retros/${retroId}/items`);
  }

  async getItem(retroId: number, itemId: number): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items/${itemId}`);
  }

  async createItem(retroId: number, data: CreateItemData): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(retroId: number, itemId: number, data: UpdateItemData): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(retroId: number, itemId: number): Promise<void> {
    return this.request<void>(`/retros/${retroId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async voteItem(retroId: number, itemId: number): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items/${itemId}/vote`, {
      method: 'POST',
    });
  }

  // Participant endpoints
  async getParticipants(retroId: number): Promise<Participant[]> {
    return this.request<Participant[]>(`/retros/${retroId}/participants`);
  }

  async joinRetro(retroId: string, data: JoinRetroData): Promise<Participant> {
    return this.request<Participant>(`/retros/${retroId}/participants/join`, {
      method: 'POST',
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
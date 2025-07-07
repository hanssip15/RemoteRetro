const API_BASE_URL = '/api';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Retro {
  id: number;
  title: string;
  description?: string;
  teamSize?: number;
  duration: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  format?: string;
}


export interface RetroItem {
  id: number;
  retroId: number;
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
  description?: string;
  teamSize?: number;
  duration?: number;
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

  async getRetro(id: number): Promise<{ retro: Retro; items: RetroItem[]; participants: Participant[] }> {
    return this.request<{ retro: Retro; items: RetroItem[]; participants: Participant[] }>(`/retros/${id}`);
  }

  async createRetro(data: CreateRetroData): Promise<Retro> {
    return this.request<Retro>('/retros', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async createItem(retroId: number, data: CreateItemData): Promise<RetroItem> {
    return this.request<RetroItem>(`/retros/${retroId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateItem(itemId: number, data: UpdateItemData): Promise<RetroItem> {
    return this.request<RetroItem>(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(itemId: number): Promise<void> {
    return this.request<void>(`/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Participant endpoints
  async getParticipants(retroId: number): Promise<Participant[]> {
    return this.request<Participant[]>(`/retros/${retroId}/participants`);
  }

  async joinRetro(retroId: number, data: JoinRetroData): Promise<Participant> {
    return this.request<Participant>(`/retros/${retroId}/participants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async leaveRetro(retroId: number, participantId: number): Promise<void> {
    return this.request<void>(`/retros/${retroId}/participants/${participantId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
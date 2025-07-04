const API_BASE_URL = '/api';

export interface Retro {
  id: number;
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
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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

  async joinRetro(retroId: number, data: JoinRetroData): Promise<Participant> {
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

export const apiService = new ApiService(); 
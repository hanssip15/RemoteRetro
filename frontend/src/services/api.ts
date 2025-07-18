
const API_BASE_URL = '/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
  image_url?: string;
}

export interface Retro {
  id: string;
  title: string;
  format: string;
  status: string;
  currentPhase?: string;
  createdAt: string;
  createdBy: string;
}

export interface GroupItemEntity {
  id: number;
  label: string;
  item_id: string;
  group_id: number;
  item: RetroItem;
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
  isEdited?: boolean;
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
  category?: string;
  author?: string;
  userId?: string;
}

export interface addParticipantData {
  role: boolean;
  userId: string;
}

export interface GroupsData {
  id: number;
  label: string;
  retro_id: string;
  votes: number;
  group_items: GroupItemEntity[];
}

export interface CreateGroupData {
  retro_id: string;
  groups: Array<{
    groupId: string;
    itemIds: string[];
  }>;
}

export interface CreateLabelGroupSingle {
  label: string;
  votes: number;
}
export interface CreateActionData {
  retro_id: string;
  action_item: string;
  assign_to: string;
}



class ApiService {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = sessionStorage.getItem('auth_token');
    
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      // console.log('Making request with config:', config);
      const response = await fetch(url, config);
      
      // console.log('Response status:', response.status);
      // console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          // Clear invalid session data
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user_data');
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
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async createAction(data: CreateActionData): Promise<any> {
    return this.request<any>('/action', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBulkActions(data: CreateActionData[]): Promise<any> {
    return this.request<any>('/action/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAction(retro_id:string ): Promise<any> {
    return this.request<GroupsData[]>(`/action/${retro_id}`);
  }


  async createGroup(retro_id: string, data: CreateLabelGroupSingle): Promise<GroupsData> {
    return this.request<GroupsData>(`/group/${retro_id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createGroupItem(groupId: string, itemId: string): Promise<GroupsData> {
    return this.request<GroupsData>(`/group-item/${groupId}/${itemId}`, {
      method: 'POST',
    });
  }

  async getLabelsByRetro(retro_id: string): Promise<GroupsData[]> {
    return this.request<GroupsData[]>(`/group/${retro_id}`);
  }

  // Voting methods
  async submitUserVote(retroId: string, userId: string, groupLabel: string, voteCount: number): Promise<any> {
    return this.request<any>('/voting/vote', {
      method: 'POST',
      body: JSON.stringify({
        retroId,
        userId,
        groupLabel,
        voteCount
      }),
    });
  }

  async submitAllVotes(retroId: string, facilitatorId: string): Promise<any> {
    return this.request<any>('/voting/submit', {
      method: 'POST',
      body: JSON.stringify({
        retroId,
        facilitatorId
      }),
    });
  }

  async getVoteResults(retroId: string): Promise<GroupsData[]> {
    return this.request<GroupsData[]>(`/voting/results/${retroId}`);
  }

  async getUserVotes(retroId: string): Promise<any> {
    return this.request<any>(`/voting/user-votes/${retroId}`);
  }

  async updateLabel(id: number, label: string): Promise<GroupsData> {
    return this.request<GroupsData>(`/group/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ label }),
    });
  }

  async updateVotes(id: number, votes: number): Promise<GroupsData> {
    return this.request<GroupsData>(`/group/${id}/votes`, {
      method: 'PUT',
      body: JSON.stringify({ votes }),
    });
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
    return this.request<Retro>(`/retros/${retroId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePhase(retroId: string, phase: string, facilitatorId: string): Promise<Retro> {
    return this.request<Retro>(`/retros/${retroId}/phase`, {
      method: 'PUT',
      body: JSON.stringify({ phase, facilitatorId }),
    });
  }
  async removeParticipant(retroId: number, participantId: number): Promise<void> {
    return this.request<void>(`/retros/${retroId}/participants/${participantId}`, {
      method: 'DELETE',
    });
  }
  async getUserByEmail(email: string): Promise<User> {
    return this.request<User>(`/users/${email}`);
  }

  // Dashboard endpoints
  async getDashboardRetros(userId: string, page = 1, limit = 3): Promise<{
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
    return this.request(`/dashboard/retros?page=${page}&limit=${limit}&userId=${userId}`);
  }

  async getDashboardStats(userId: string): Promise<{
    userId: string;
    totalRetros: number;
    uniqueMembers: number;
    actionItems: {
      total: number;
      completed: number;
    };
  }> {
    return this.request(`/dashboard/stats/${userId}`);
  }

  // Send action items email to participants
  async sendActionItemsEmail(data: {
    retroId: string;
    retroTitle: string;
    actionItems: Array<{ task: string; assigneeName: string }>;
    participantEmails: string[];
  }): Promise<any> {
    return this.request<any>('/email/send-action-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
// api.ts
export const fetchProtectedData = async () => {
  const token = sessionStorage.getItem('auth_token');
  const res = await fetch(`${process.env.BASE_URL}/protected-route`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Not authorized');
  return await res.json();
};

export const apiService = new ApiService();

export const api = Object.assign(apiService, {
  // Get current user info from session
  getCurrentUser: async (): Promise<any> => {
    const userData = sessionStorage.getItem('user_data');
    if (!userData) {
      return null; // or handle as needed
    }
    const user = JSON.parse(userData);
    const userDb = await apiService.getUserByEmail(user.email);
    if (userDb === null) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
      return null; // or handle as needed
    }
    return user;
  },
  // Set auth token and user data
  setAuthToken: (token: string, userData?: any) => {
    sessionStorage.setItem('auth_token', token);
    if (userData) {
      sessionStorage.setItem('user_data', JSON.stringify(userData));
    }
  },
  // Remove auth token and user data (logout)
  removeAuthToken: () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
  },
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!(sessionStorage.getItem('auth_token') && sessionStorage.getItem('user_data'));
  },
  // Set user data in session
  setUserData: (userData: any) => {
    sessionStorage.setItem('user_data', JSON.stringify(userData));
  }
}); 
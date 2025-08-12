
const API_BASE_URL = import.meta.env.VITE_API_URL;

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
  createdBy: string;
  facilitator: string;
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
  isActive: boolean;
}

export interface GroupsData {
  id: number;
  label: string;
  retro_id: string;
  votes: number;
  group_items: GroupItemEntity[];
}

export interface ActionItemData {
    id?: string;
    assignee?: string;
    assigneeId?: string;
    assigneeName?: string;
    task: string;
    edited?: boolean;
    createdBy?: string;
    createdAt?: string;
}

export interface finalActionItemData {
  retroId : string;
  assigneeName : string;

}

export interface CreateGroupData {
  retro_id: string;
  groups: Array<{
    groupId: string;
    itemIds: string[];
  }>;
}

export interface CreateGroup {
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
      const response = await fetch(url, config);
      if (!response.ok) {
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
  // ================== USER ================== //
  // async getUserByUserId(userId: string): Promise<User> {
  //   return this.request<User>(`/user/v1/users/${userId}`);
  // }

  // ================== RETRO ================== //
  // Mengambil data Retro berdasarkan Id
  async getRetro(retro_id: string): Promise<{ retro: Retro; participants: Participant[] }> {
    return this.request<{ retro: Retro; participants: Participant[] }>(`/retro/v1/retros/${retro_id}`);
  }

  // Membuat retro baru
  async createRetro(data: CreateRetroData): Promise<Retro> {
    const result = await this.request<Retro>('/retro/v1/retros/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  }

  // Mengubah status retro
  async updateRetroStatus(retro_id: string, data: UpdateRetroData): Promise<Retro> {
    return this.request<Retro>(`/retro/v1/retros/${retro_id}/update-status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Mengubah phase retro
  async updateRetroPhase(retro_id: string, phase: string): Promise<Retro> {
    return this.request<Retro>(`/retro/v1/retros/${retro_id}/update-phase`, {
      method: 'PATCH',
      body: JSON.stringify({ phase}),
    });
  }

  // ================== PARTICIPANT ================== //
  // Mengambil partisipan dari suatu retro
  async getParticipants(retro_id: string): Promise<Participant[]> {
    return this.request<Participant[]>(`/participant/v1/retros/${retro_id}`);
  }

  // Menambahkan participant pada suatu retro
  async addParticipant(retro_id: string, data: addParticipantData): Promise<Participant> {
    return this.request<Participant>(`/participant/v1/retros/${retro_id}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Mengubah peran partisipan
  async updateParticipantRole(retro_id: string, participant_id: number): Promise<Participant> {
    return this.request<Participant>(`/participant/v1/retros/${retro_id}/participant/${participant_id}/update-role`, {
      method: 'PATCH'
    });
  }

  // ================== GROUP ================== //
  
  // Membuat group baru pada suatu retro
  async createGroup(retro_id: string, data: CreateGroup): Promise<GroupsData> {
    return this.request<GroupsData>(`/group/v1/retros/${retro_id}/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createGroupItem(groupId: string, itemId: string): Promise<GroupsData> {
    return this.request<GroupsData>(`/group-item/${groupId}/${itemId}`, {
      method: 'POST',
    });
  }
  // Mendapatkan group dari suatu retro
  async getGroup(retro_id: string): Promise<GroupsData[]> {
    return this.request<GroupsData[]>(`/group/v1/retros/${retro_id}`);
  }
  // Mengubah label yang ada pada group
  async updateLabel(group_id: number, label: string): Promise<GroupsData> {
    return this.request<GroupsData>(`/group/v1/groups/${group_id}/update-label`, {
      method: 'PATCH',
      body: JSON.stringify({ label }),
    });
  }
  // Mengupdate votingan group
  async updateVotes(group_id: number, votes: number): Promise<GroupsData> {
    return this.request<GroupsData>(`/group/v1/groups/${group_id}/update-votes`, {
      method: 'PATCH',
      body: JSON.stringify({ votes }),
    });
  }

  // ================== GROUP-ITEM ================== //
  // Membuat item baru 
  async createItem(retro_id: string, data: CreateItemData): Promise<RetroItem> {
    return this.request<RetroItem>(`/group-item/v1/retros/${retro_id}/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  // Mendapatkan items dari suatu retro
  async getItems(retro_id: string): Promise<RetroItem[]> {
    return this.request<RetroItem[]>(`/group-item/v1/retros/${retro_id}`);
  }
  // Mengubah item pada suatu retro
  async updateItem(retro_id: string, itemId: string, data: UpdateItemData): Promise<RetroItem> {
    return this.request<RetroItem>(`/group-item/v1/retros/${retro_id}/item/${itemId}/update-item`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteItem(retro_id: string, itemId: string, userId?: string): Promise<RetroItem> {
    return this.request<RetroItem>(`/group-item/v1/retros/${retro_id}/item/${itemId}/delete-item`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }
  // async deleteItem(retroId: string, itemId: string, userId?: string): Promise<{ success: boolean; message: string; itemId: string }> {
  //   if (userId) {
  //     try {
  //       // Try with body first
  //       const options: RequestInit = {
  //         method: 'DELETE',
  //         body: JSON.stringify({ userId }),
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       };
        
  //       return await this.request<{ success: boolean; message: string; itemId: string }>(`/retro/${retroId}/items/${itemId}`, options);
  //     } catch (error) {
  //       try {
  //         // Fallback to query parameter if body fails
  //         return await this.request<{ success: boolean; message: string; itemId: string }>(`/retro/${retroId}/items/${itemId}/delete?userId=${userId}`, {
  //           method: 'DELETE',
  //         });
  //       } catch (secondError) {
  //         // Final fallback to PUT endpoint
  //         return this.request<{ success: boolean; message: string; itemId: string }>(`/retro/${retroId}/items/${itemId}/delete`, {
  //           method: 'PUT',
  //           body: JSON.stringify({ userId }),
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //         });
  //       }
  //     }
  //   } else {
  //     // Fallback without userId
  //     return this.request<{ success: boolean; message: string; itemId: string }>(`/retro/${retroId}/items/${itemId}`, {
  //       method: 'DELETE',
  //     });
  //   }
  // }

  // ================== ACTION-ITEM ================== // 
  // Membuat action item lebih dari 1
  async createBulkActions(data: CreateActionData[]): Promise<any> {
    return this.request<any>('/action-item/v1/action-items/create-bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  // Mendapatkan action item dari suatu retro
  async getAction(retro_id:string ): Promise<any> {
    return this.request<ActionItemData[]>(`/action-item/v1/retros/${retro_id}`);
  }
  
  // ================== DASHBOARD ================== //
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
    return this.request(`/dashboard/v1/retros?page=${page}&limit=${limit}&userId=${userId}`);
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
    return this.request(`/dashboard/v1/stats/${userId}`);
  }

  // ================== EMAIL ================== //
  // Mengirim email kepada setiap partsipant
  async sendActionItemsEmail(data: {
    retroId: string;
    retroTitle: string;
    actionItems: Array<{ task: string; assigneeName: string }>;
    participantEmails: string[];
  }): Promise<any> {
    return this.request<any>('/email/v1/items/send-action-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
// api.ts
export const fetchProtectedData = async () => {
  const token = sessionStorage.getItem('auth_token');
  const res = await fetch(`${import.meta.env.VITE_API_URL}/protected-route`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Not authorized');
  return await res.json();
};

export const apiService = new ApiService();

export const api = Object.assign(apiService, {
  getCurrentUser: async (): Promise<any> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        credentials: 'include', // penting agar cookie dikirim
      });

      if (!res.ok) {
        return null;
      }

      const user = await res.json();
      return user;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      return null;
    }
  },

  setAuthToken: (_token: string, _userData?: any) => {
  },

  // Logout dari backend dan bersihkan apa pun di frontend (kalau perlu)
  removeAuthToken: async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },

  // Cek apakah user sudah login dengan cara memanggil API
  isAuthenticated: async (): Promise<boolean> => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
      credentials: 'include', // penting agar cookie dikirim
    });

    return !!res.ok;
  },

  // Simpan user data kalau mau secara lokal (tidak wajib)
  setUserData: (userData: any) => {
    sessionStorage.setItem('user_data', JSON.stringify(userData));
  }
});

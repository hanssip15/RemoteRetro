import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeedbackCard } from "@/components/feedback-card"
import { ArrowLeft, Users, Clock, Share2 } from "lucide-react"
import { Link } from "react-router-dom"
import { apiService, Retro, RetroItem, Participant } from "@/services/api"

// Interface untuk data grup
interface GroupData {
  groups: Array<{
    id: string;
    name: string;
    color: string;
    itemIds: string[];
    createdAt: string;
  }>;
  lastUpdated: string;
}

interface DatabaseGroupData {
  retroId: string;
  groups: Array<{
    groupId: string;
    groupName: string;
    groupColor: string;
    itemIds: string[];
    createdAt: string;
  }>;
  lastUpdated: string;
}

interface GroupedItem {
  groupId: string;
  groupName: string;
  color: string;
  items: RetroItem[];
  itemCount: number;
}

interface GroupSummary {
  totalGroups: number;
  totalGroupedItems: number;
  ungroupedItems: number;
  totalItems: number;
  groups: GroupedItem[];
}
import { useRetroSocket } from "@/hooks/use-retro-socket"
import { ShareLinkModal } from '@/components/share-link-modal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Pen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Draggable from 'react-draggable';

export default function RetroPage() {
  const params = useParams()
  const navigate = useNavigate()
  const retroId = params.id as string

  const [retro, setRetro] = useState<Retro | null>(null)
  const [items, setItems] = useState<RetroItem[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [format, setFormat] = useState<string[]>([])
  const [inputCategory, setInputCategory] = useState("format_1")
  const [inputText, setInputText] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [optimisticUpdates, setOptimisticUpdates] = useState<{ [itemId: string]: { content: string; category: string } }>({})
  const [showShareModal, setShowShareModal] = useState(false);
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  });
  const [isPhaseChanging, setIsPhaseChanging] = useState(false);
  const [phase, setPhase] = useState<'submit' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems'>('submit');
  const [itemPositions, setItemPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [itemGroups, setItemGroups] = useState<{ [key: string]: string }>({}); // itemId -> signature
  const [groupColors, setGroupColors] = useState<{ [key: number]: string }>({}); // groupId -> color (deprecated)
  const [highContrast, setHighContrast] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const [groupLabels, setGroupLabels] = useState<string[]>(["", ""]); // contoh 2 group

  // Data structure untuk menyimpan grup yang bisa dimasukkan ke database
  const [groupData, setGroupData] = useState<GroupData>({
    groups: [],
    lastUpdated: new Date().toISOString()
  });

  // Promote to Facilitator Confirmation
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  // Helper warna random konsisten
  function getNextColor(used: string[]): string {
    const palette = [
      '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6F91', '#845EC2', '#FFC75F', '#0081CF', '#B0A8B9', '#F9F871',
      '#F67280', '#C06C84', '#355C7D', '#2EC4B6', '#FF9F1C', '#E07A5F', '#3D5A80', '#98C1D9', '#293462', '#F7B801',
    ];
    for (let color of palette) {
      if (!used.includes(color)) return color;
    }
    // fallback: truly random
    let color;
    do {
      color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    } while (used.includes(color));
    return color;
  }

  function isOverlap(a: DOMRect, b: DOMRect) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  // Pewarnaan group: connected components + warna primary group stabil dengan signature
  function computeGroupsAndColors(
    items: RetroItem[],
    positions: { [id: string]: { x: number; y: number } },
    prevSignatureColors: { [signature: string]: string },
    usedColors: string[],
  ) {
    // Build graph: node = item, edge = overlap
    const refs: { [id: string]: HTMLDivElement | null } = {};
    items.forEach(item => {
      refs[item.id] = document.getElementById('group-item-' + item.id) as HTMLDivElement;
    });
    const adj: { [id: string]: string[] } = {};
    items.forEach(item => { adj[item.id] = []; });
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const id1 = items[i].id;
        const id2 = items[j].id;
        const ref1 = refs[id1];
        const ref2 = refs[id2];
        if (ref1 && ref2) {
          const rect1 = ref1.getBoundingClientRect();
          const rect2 = ref2.getBoundingClientRect();
          if (isOverlap(rect1, rect2)) {
            adj[id1].push(id2);
            adj[id2].push(id1);
          }
        }
      }
    }
    // Cari connected components
    const visited: { [id: string]: boolean } = {};
    const itemToGroup: { [id: string]: string } = {}; // itemId -> signature
    const groupSignatures: string[] = [];
    for (let item of items) {
      if (!visited[item.id]) {
        // BFS
        const queue = [item.id];
        visited[item.id] = true;
        let members: string[] = [];
        while (queue.length) {
          const curr = queue.shift()!;
          members.push(curr);
          for (let neighbor of adj[curr]) {
            if (!visited[neighbor]) {
              visited[neighbor] = true;
              queue.push(neighbor);
            }
          }
        }
        members.sort();
        const signature = members.join('|');
        groupSignatures.push(signature);
        members.forEach(id => { itemToGroup[id] = signature; });
      }
    }
    // Assign warna: signature yang sudah pernah ada, pakai warna lama. Signature baru, assign warna baru dari pool.
    let newSignatureColors = { ...prevSignatureColors };
    let newUsedColors = [...usedColors];
    // Cari warna yang sudah tidak dipakai (karena signature group sudah tidak ada)
    const releasedColors: string[] = [];
    for (const sig in prevSignatureColors) {
      if (!groupSignatures.includes(sig)) {
        // Warna signature ini bisa direuse
        const color = prevSignatureColors[sig];
        if (color && !releasedColors.includes(color)) releasedColors.push(color);
        delete newSignatureColors[sig];
      }
    }
    // Assign warna untuk signature baru
    groupSignatures.forEach(sig => {
      if (!newSignatureColors[sig]) {
        let color = releasedColors.shift();
        if (!color) {
          color = getNextColor(newUsedColors);
        }
        newSignatureColors[sig] = color;
        newUsedColors.push(color);
      }
    });
    return { itemToGroup, newSignatureColors, newUsedColors };
  }

  // State untuk pool warna dan mapping signature
  const [signatureColors, setSignatureColors] = useState<{ [signature: string]: string }>({});
  const [usedColors, setUsedColors] = useState<string[]>([]);

  // Fungsi untuk mengkonversi itemGroups menjadi struktur data yang bisa disimpan ke database
  const convertGroupsToDatabaseFormat = useCallback(() => {
    const groupsMap = new Map<string, string[]>();
    
    // Mengelompokkan item berdasarkan signature
    Object.entries(itemGroups).forEach(([itemId, signature]) => {
      if (!groupsMap.has(signature)) {
        groupsMap.set(signature, []);
      }
      groupsMap.get(signature)!.push(itemId);
    });

    // Konversi ke format yang bisa disimpan ke database
    const groups = Array.from(groupsMap.entries()).map(([signature, itemIds], index) => {
      const color = signatureColors[signature] || getNextColor([]);
      return {
        id: `group_${signature}_${Date.now()}_${index}`,
        name: `Group ${index + 1}`,
        color: color,
        itemIds: itemIds,
        createdAt: new Date().toISOString()
      };
    });

    return {
      groups: groups,
      lastUpdated: new Date().toISOString()
    };
  }, [itemGroups, signatureColors]);

  // Fungsi untuk menyimpan data grup (akan diimplementasikan untuk database)
  const saveGroupData = useCallback((): DatabaseGroupData => {
    const dataToSave = convertGroupsToDatabaseFormat();
    setGroupData(dataToSave);
    
    // Data yang siap untuk disimpan ke database
    const databaseData: DatabaseGroupData = {
      retroId: retroId,
      groups: dataToSave.groups.map(group => ({
        groupId: group.id,
        groupName: group.name,
        groupColor: group.color,
        itemIds: group.itemIds,
        createdAt: group.createdAt
      })),
      lastUpdated: dataToSave.lastUpdated
    };

    return databaseData;
  }, [convertGroupsToDatabaseFormat, retroId]);

  // Fungsi untuk mendapatkan data grup yang sudah dikelompokkan
  const getGroupedItems = useCallback((): GroupedItem[] => {
    const groupsMap = new Map<string, { items: RetroItem[], color: string }>();
    
    items.forEach(item => {
      const signature = itemGroups[item.id];
      if (signature) {
        if (!groupsMap.has(signature)) {
          groupsMap.set(signature, {
            items: [],
            color: signatureColors[signature] || '#e5e7eb'
          });
        }
        groupsMap.get(signature)!.items.push(item);
      } else {
        // Item yang tidak tergrouping
        if (!groupsMap.has('ungrouped')) {
          groupsMap.set('ungrouped', {
            items: [],
            color: '#e5e7eb'
          });
        }
        groupsMap.get('ungrouped')!.items.push(item);
      }
    });

    return Array.from(groupsMap.entries()).map(([signature, data], index) => ({
      groupId: signature,
      groupName: signature === 'ungrouped' ? 'Ungrouped Items' : `Group ${index + 1}`,
      color: data.color,
      items: data.items,
      itemCount: data.items.length
    }));
  }, [items, itemGroups, signatureColors]);

  // Fungsi untuk mendapatkan ringkasan grup
  const getGroupSummary = useCallback((): GroupSummary => {
    const groupedItems = getGroupedItems();
    const totalGroups = groupedItems.filter(group => group.groupId !== 'ungrouped').length;
    const totalGroupedItems = groupedItems.reduce((sum, group) => 
      group.groupId !== 'ungrouped' ? sum + group.itemCount : sum, 0
    );
    const ungroupedItems = groupedItems.find(group => group.groupId === 'ungrouped')?.itemCount || 0;

    return {
      totalGroups,
      totalGroupedItems,
      ungroupedItems,
      totalItems: items.length,
      groups: groupedItems
    };
  }, [getGroupedItems, items.length]);

  // Throttle untuk broadcast position updates
  const [lastBroadcastTime, setLastBroadcastTime] = useState<{ [itemId: string]: number }>({});

  // Handler drag - update posisi dan group/color
  const handleDrag = (id: string, e: any, data: any) => {
    setItemPositions(pos => {
      const newPos = { ...pos, [id]: { x: data.x, y: data.y } };
      
      // Broadcast posisi ke partisipan lain (throttled to 100ms)
      if (socket && isConnected && user) {
        const now = Date.now();
        const lastBroadcast = lastBroadcastTime[id] || 0;
        
        if (now - lastBroadcast > 100) { // Throttle to 100ms
          socket.emit('item-position-update', {
            retroId: retroId,
            itemId: id,
            position: { x: data.x, y: data.y },
            userId: user.id
          });
          setLastBroadcastTime(prev => ({ ...prev, [id]: now }));
        }
      }
      
      // Compute grouping after a short delay to allow DOM to update
      setTimeout(() => {
        const { itemToGroup, newSignatureColors, newUsedColors } = computeGroupsAndColors(
          items,
          newPos,
          signatureColors,
          usedColors,
        );
        
        // Update local state
        setItemGroups(itemToGroup);
        setSignatureColors(newSignatureColors);
        setUsedColors(newUsedColors);
        
        // Broadcast grouping update to other users
        if (socket && isConnected && user) {
          socket.emit('grouping-update', {
            retroId: retroId,
            itemGroups: itemToGroup,
            signatureColors: newSignatureColors,
            userId: user.id
          });
        }
      }, 50); // Slightly longer delay to ensure DOM is updated
      
      return newPos;
    });
  };

  const handleStop = (id: string, e: any, data: any) => {
    setItemPositions(pos => ({ ...pos, [id]: { x: data.x, y: data.y } }));
    
    // Final grouping computation after drag stops
    setTimeout(() => {
      const { itemToGroup, newSignatureColors, newUsedColors } = computeGroupsAndColors(
        items,
        { ...itemPositions, [id]: { x: data.x, y: data.y } },
        signatureColors,
        usedColors,
      );
      
      // Update local state
      setItemGroups(itemToGroup);
      setSignatureColors(newSignatureColors);
      setUsedColors(newUsedColors);
      
      // Broadcast final grouping update to other users
      if (socket && isConnected && user) {
        socket.emit('grouping-update', {
          retroId: retroId,
          itemGroups: itemToGroup,
          signatureColors: newSignatureColors,
          userId: user.id
        });
      }
    }, 100);
  };

  // Load phase from retro data when component mounts or retro changes
  useEffect(() => {
    if (retro?.currentPhase) {
      setPhase(retro.currentPhase as 'submit' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems');
      console.log('🔄 Loaded phase from retro:', retro.currentPhase);
    } else {
      setPhase('submit');
      console.log('🔄 Set default phase: submit');
    }
    console.log('Render RetroPage');
    console.log('Render SubmitPhase');
  }, [retro?.currentPhase]);

  

  const currentUserRole = participants.find(p => p.user.id === user?.id)?.role || false;
  
 

  // Memoize WebSocket handlers to prevent unnecessary re-renders
  const handleItemAdded = useCallback((newItem: RetroItem) => {
    console.log('📝 WebSocket: Item added event received:', newItem);
    console.log('📝 Current items count before update:', items.length);
    
    setItems(prev => {
      // Check if item already exists to avoid duplicates
      const exists = prev.find(item => item.id === newItem.id);
      if (exists) {
        console.log('⚠️ Item already exists, skipping:', newItem.id);
        return prev;
      }
      
      // Check if we have an optimistic item with same content
      const optimisticItem = prev.find(item => 
        item.id.startsWith('temp-') && 
        item.content === newItem.content &&
        item.category === newItem.category
      );
      
      if (optimisticItem) {
        console.log('🔄 Replacing optimistic item with real item:', newItem.id);
        return prev.map(item => item.id === optimisticItem.id ? newItem : item);
      }
      
      console.log('➕ Adding new item to state:', newItem.id);
      const newItems = [...prev, newItem];
      console.log('📝 New items count after update:', newItems.length);
      return newItems;
    });
  }, [items.length]);

  const handleItemUpdated = useCallback((updatedItem: RetroItem) => {
    console.log('✏️ WebSocket: Item updated event received:', updatedItem);
    setItems(prev => prev.map(item => {
      if (item.id === updatedItem.id) {
        // Check if we have an optimistic update for this item
        const optimisticUpdate = optimisticUpdates[updatedItem.id];
        if (optimisticUpdate) {
          // We have an optimistic update, ignore WebSocket update
          console.log('🔄 Ignoring WebSocket update due to optimistic update');
          return item;
        } else {
          // No optimistic update, use WebSocket data
          return updatedItem;
        }
      }
      return item;
    }));
  }, [optimisticUpdates]);

  const handleItemDeleted = useCallback((itemId: string) => {
    console.log('🗑️ WebSocket: Item deleted event received:', itemId);
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleItemsUpdate = useCallback((newItems: RetroItem[]) => {
    console.log('📋 WebSocket: Items update event received:', newItems);
    setItems(newItems);
  }, []);

  const handleParticipantUpdate = useCallback(() => {
    console.log('👥 WebSocket: Participant update event received');
    // Refresh participants data
    fetchRetroData();
  }, []);

  const handlePhaseChange = useCallback((newPhase: 'submit' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems') => {
    console.log('🔄 WebSocket: Phase change event received:', newPhase);
    setPhase(newPhase);
    // Don't set isPhaseChanging to false here as it's handled by the button
  }, []);

  // State untuk tracking item yang sedang di-drag oleh user lain
  const [draggingByOthers, setDraggingByOthers] = useState<{ [itemId: string]: string }>({});

  // Handler untuk menerima posisi item dari partisipan lain
  const handleItemPositionUpdate = useCallback((data: { itemId: string; position: { x: number; y: number }; userId: string }) => {
    // Hanya update jika bukan dari user saat ini
    if (data.userId !== user?.id) {
      setItemPositions(pos => ({ ...pos, [data.itemId]: data.position }));
      // Set item sebagai sedang di-drag oleh user lain
      setDraggingByOthers(prev => ({ ...prev, [data.itemId]: data.userId }));
      
      // Clear dragging state setelah 2 detik
      setTimeout(() => {
        setDraggingByOthers(prev => {
          const newState = { ...prev };
          delete newState[data.itemId];
          return newState;
        });
      }, 2000);
    }
  }, [user?.id]);

  // Handler untuk menerima grouping update dari partisipan lain
  const handleGroupingUpdate = useCallback((data: { 
    itemGroups: { [itemId: string]: string }; 
    signatureColors: { [signature: string]: string };
    userId: string 
  }) => {
    // Hanya update jika bukan dari user saat ini
    if (data.userId !== user?.id) {
      console.log('🎨 Received grouping update from other user:', data);
      setItemGroups(data.itemGroups);
      setSignatureColors(data.signatureColors);
    }
  }, [user?.id]);

  // Initialize WebSocket connection using the stable hook
  const { isConnected, socket } = useRetroSocket({
    retroId,
    onItemAdded: handleItemAdded,
    onItemUpdated: handleItemUpdated,
    onItemDeleted: handleItemDeleted,
    onItemsUpdate: handleItemsUpdate,
    onParticipantUpdate: handleParticipantUpdate,
    onPhaseChange: handlePhaseChange,
    onItemPositionUpdate: handleItemPositionUpdate,
    onGroupingUpdate: handleGroupingUpdate,
  });

  // Fungsi untuk mengirim phase change ke semua partisipan
  const broadcastPhaseChange = useCallback(async (newPhase: 'submit' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems') => {
    if (!user?.id) {
      console.error('❌ No user ID available for phase change');
      return;
    }

    try {
      console.log('📡 Updating phase via API:', newPhase);
      await apiService.updatePhase(retroId, newPhase, user.id);
      
      // Phase change will be broadcasted via WebSocket from the server
      console.log('✅ Phase updated successfully');
    } catch (error) {
      console.error('❌ Failed to update phase:', error);
      setError('Failed to change phase. Please try again.');
    }
  }, [retroId, user?.id]);

  const fetchRetroData = useCallback(async () => {
    try {
      const data = await apiService.getRetro(retroId)
      if (data.retro.format === "happy_sad_confused") {
        setFormat(["format_1", "format_2", "format_3"])
      } else {
        setFormat(["format_1", "format_2", "format_3"])
      }
      if (!data.retro) {
        throw new Error("No retro data in response")
      }
      setRetro(data.retro)
      setParticipants(data.participants || [])
    } catch (error) {
      console.error("Error fetching retro data:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to fetch retro data: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [retroId])

  const checkAndJoinParticipant = useCallback(async () => {
    if (!user || !retroId) return;
    const participant = participants.find((p) => p.user.id === user.id);
    if (!participant) {
      try {
        await apiService.addParticipant(retroId, {
          userId: user.id,
          role: false,
        });
        // Refresh data setelah join
        const data = await apiService.getRetro(retroId);
        setRetro(data.retro);
        setParticipants(data.participants || []);
      } catch (error) {
        console.error("Failed to join as participant:", error);
      }
    }
  }, [user, retroId, participants]);
  const fetchItems = useCallback(async () => {
    try {
      const itemsData = await apiService.getItems(retroId)
      console.log('📦 Items data from API:', itemsData);
      setItems(itemsData)
      
      // Initialize item positions with default layout (no database persistence)
      const positions: { [key: string]: { x: number; y: number } } = {};
      itemsData.forEach((item, index) => {
        // Default grid layout for items
        positions[item.id] = { 
          x: 200 + (index % 3) * 220, 
          y: 100 + Math.floor(index / 3) * 70 
        };
      });
      console.log('🎯 Initial positions object:', positions);
      setItemPositions(positions);
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }, [retroId])
  
  const handleAdd = useCallback(async () => {
    if (!inputText.trim() || !user) return;

    setIsAddingItem(true)
    
    // Create optimistic item for immediate UI update
    const optimisticItem: RetroItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      retroId: retroId,
      category: inputCategory,
      content: inputText.trim(),
      author: user.name || user.email,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update - add item immediately to UI
    setItems(prev => [...prev, optimisticItem]);
    setInputText(""); // Clear input immediately

    try {
      const newItem = await apiService.createItem(retroId, {
        category: inputCategory,
        content: inputText.trim(),
        created_by: user.id,
        author: user.name || user.email,
      })

      // Replace optimistic item with real item from server
      setItems(prev => prev.map(item => 
        item.id === optimisticItem.id ? newItem : item
      ));

      console.log('✅ Item submitted successfully:', newItem);
    } catch (error) {
      console.error("Error adding item:", error)
      
      // Remove optimistic item on error
      setItems(prev => prev.filter(item => item.id !== optimisticItem.id));
      setInputText(inputText.trim()); // Restore input text
      
      setError("Failed to add item. Please try again.")
    } finally {
      setIsAddingItem(false)
    }
  }, [inputText, user, inputCategory, retroId]);

  const handleUpdateItem = useCallback(async (itemId: string, content: string, category: string) => {
    if (!user) return;

    setIsUpdatingItem(true)
    setUpdatingItemId(itemId)
    
    // Store optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [itemId]: { content, category } }))
    
    // Optimistic update - immediately update the item in state
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, content, category, isEdited: true }
        : item
    ));

    try {
      await apiService.updateItem(retroId, itemId, { 
        content,
        category,
        userId: user.id 
      })
      // Note: Item will be updated via WebSocket broadcast with server data
    } catch (error) {
      console.error("Error updating item:", error)
      setError("Failed to update item. Please try again.")
      
      // Revert optimistic update on error
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, content: item.content, category: item.category, isEdited: item.isEdited }
          : item
      ));
    } finally {
      setIsUpdatingItem(false)
      setUpdatingItemId(null)
      // Clear optimistic update after a delay to allow WebSocket to process
      setTimeout(() => {
        setOptimisticUpdates(prev => {
          const newUpdates = { ...prev };
          delete newUpdates[itemId];
          return newUpdates;
        });
      }, 1000);
    }
  }, [retroId, user, items]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!user) return;

    setIsDeletingItem(true)
    try {
       await apiService.deleteItem(retroId, itemId)
      // Note: Item will be deleted via WebSocket broadcast
    } catch (error) {
      console.error("Error deleting item:", error)
      setError("Failed to delete item. Please try again.")
    } finally {
      setIsDeletingItem(false)
    }
  }, [retroId, user]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddingItem) {
      handleAdd();
    }
  }, [handleAdd, isAddingItem]);

  const getItemsByCategory = useCallback((category: string) => {
    return items.filter((item) => item.category === category)
  }, [items])

  const getCategoryDisplayName = useCallback((category: string) => {
    if (retro?.format === "happy_sad_confused") {
      const mapping = {
        "format_1": "Happy",
        "format_2": "Sad", 
        "format_3": "Confused"
      }
      return mapping[category as keyof typeof mapping] || category
    } else {
      const mapping = {
        "format_1": "Start",
        "format_2": "Stop",
        "format_3": "Continue"
      }
      return mapping[category as keyof typeof mapping] || category
    }
  }, [retro?.format])

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    // You could add a toast notification here
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    // If the ID is "new", redirect to the new retro page
    if (retroId === "new") {
      navigate("/retro/new")
      return
    }

    fetchRetroData()
    fetchItems()
  }, [retroId, navigate, fetchRetroData, fetchItems])

  // Separate useEffect untuk checkAndJoinParticipant
  useEffect(() => {
    if (retro && participants.length > 0 && user) {
      checkAndJoinParticipant()
    }
  }, [retro, participants, user, checkAndJoinParticipant])
  const isCurrentFacilitator = participants.find(x => x.role)?.user.id === user?.id;
  const currentUserParticipant = participants.find(x => x.user.id === user?.id);
  
  const handlePromoteToFacilitator = useCallback(async (participantId: number) => {
    if (!user) return;
    try {
      await apiService.updateParticipantRole(retroId, participantId);
      await fetchRetroData();
    } catch (error) {
      console.error("Error promoting to facilitator:", error);  
      setError("Failed to promote to facilitator. Please try again.");
      throw error;
    }
  }, [retroId, user, fetchRetroData]);

  // Request state dari server saat socket connect
  useEffect(() => {
    if (socket && isConnected && retroId) {
      // Request state terkini dari server
      socket.emit('request-retro-state', { retroId });

      // Handler untuk menerima state dari server
      const handleRetroState = (state: { itemPositions: any, itemGroups: any, signatureColors: any }) => {
        setItemPositions(state.itemPositions || {});
        setItemGroups(state.itemGroups || {});
        setSignatureColors(state.signatureColors || {});
        console.log('🟢 Synced state from server:', state);
      };
      socket.on(`retro-state:${retroId}`, handleRetroState);

      return () => {
        socket.off(`retro-state:${retroId}`, handleRetroState);
      };
    }
  }, [socket, isConnected, retroId]);

  // PHASE 1: Submit an Idea (existing)
  const SubmitPhase = useMemo(() => {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading retrospective...</p>
          </div>
        </div>
      )
    }
    if (error || !retro) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Retrospective not found"}</h1>
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{retro?.title ?? ''}</h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{participants.length} participants</span>
                    </Badge>
                    {retro && (retro as any).duration && (
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{(retro as any).duration} min</span>
                      </Badge>
                    )}
                    <Badge variant={retro?.status === "draft" ? "default" : "secondary"}>{retro?.status ?? ''}</Badge>
                    {currentUserParticipant?.role && (
                      <Badge variant="default" className="bg-blue-500">
                        Facilitator
                      </Badge>
                    )}

                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setShowShareModal(true)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={typeof (user as any)["image_url"] === "string" ? (user as any)["image_url"] : undefined} alt={user.name} />
                          <AvatarFallback>
                            {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Share Link Modal */}
        <ShareLinkModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
        />

        {/* Phase Change Notification */}
        {isPhaseChanging && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Phase Change in Progress</h3>
              <p className="text-gray-600">Facilitator is moving to the next phase...</p>
            </div>
          </div>
        )}

        {/* Promote to Facilitator Modal */}
        {showRoleModal && selectedParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Promote to Facilitator?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to promote <strong>{selectedParticipant.user.name}</strong> to facilitator? 
                You will no longer be the facilitator.
              </p>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedParticipant(null);
                  }}
                  disabled={isPromoting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setIsPromoting(true);
                    handlePromoteToFacilitator(selectedParticipant.id).finally(() => {
                      setIsPromoting(false);
                      setShowRoleModal(false);
                      setSelectedParticipant(null);
                    });
                  }}
                  disabled={isPromoting}
                >
                  {isPromoting ? 'Promoting...' : 'Promote to Facilitator'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Retro Board */}
        <div className="container mx-auto px-4 py-8 flex-1 pb-56">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Happy */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span role="img" aria-label="happy">😀</span> {getCategoryDisplayName(format[0])}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 min-h-[200px]">
                {getItemsByCategory(format[0]).map((item) => (
                  <FeedbackCard
                    key={`${item.id}-${item.category}`}
                    item={{ ...item, author: item.author || "Anonymous" }}
                    currentUser={user}
                    userRole={currentUserRole}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    getCategoryDisplayName={getCategoryDisplayName}
                    isUpdating={updatingItemId === item.id}
                  />
                ))}
              </CardContent>
            </Card>
            {/* Sad */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span role="img" aria-label="sad">😢</span> {getCategoryDisplayName(format[1])}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 min-h-[200px]">
                {getItemsByCategory(format[1]).map((item) => (
                  <FeedbackCard
                    key={`${item.id}-${item.category}`}
                    item={{ ...item, author: item.author || "Anonymous" }}
                    currentUser={user}
                    userRole={currentUserRole}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    getCategoryDisplayName={getCategoryDisplayName}
                    isUpdating={updatingItemId === item.id}
                  />
                ))}
              </CardContent>
            </Card>
            {/* Confused */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span role="img" aria-label="confused">🤔</span> {getCategoryDisplayName(format[2])}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 min-h-[200px]">
                {getItemsByCategory(format[2]).map((item) => (
                  <FeedbackCard
                    key={`${item.id}-${item.category}`}
                    item={{ ...item, author: item.author || "Anonymous" }}
                    currentUser={user}
                    userRole={currentUserRole}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    getCategoryDisplayName={getCategoryDisplayName}
                    isUpdating={updatingItemId === item.id}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        


        {/* Input bawah sticky */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t z-40">
          <div className="container mx-auto px-4 py-4 flex flex-col items-center">
            {/* Avatar semua participants berjajar horizontal di atas card submit */}
            {participants.length > 0 && (
              <div className="flex flex-row items-end gap-6 mb-3">
                {participants.map((p) => {
                  const isCurrentUser = user && p.user.id === user.id;
                  console.log('👤 Participant user data:', p.user);
                  console.log('🖼️ User image URL:', p.user.imageUrl || p.user.image_url);
                  console.log('🔍 User object keys:', Object.keys(p.user));
                  console.log('🔍 User object values:', Object.values(p.user));
                  return (
                    <div key={p.id} className="flex flex-col items-center relative">
                      <div className="relative">
                        <Avatar
                          className={`h-14 w-14 border-2 ${p.role ? 'border-blue-500' : 'border-gray-200'} group-hover:border-indigo-500 transition`}
                          title={`${p.user.name} ${p.role ? '(Facilitator)' : '(Participant)'}`}
                        >
                          <AvatarImage 
                            src={p.user.imageUrl || p.user.image_url || undefined} 
                            alt={p.user.name} 
                            onError={(e) => {
                              console.log('❌ Avatar image failed to load for user:', p.user.name, 'URL:', p.user.imageUrl || p.user.image_url);
                              // Hide the image element on error
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ Avatar image loaded for user:', p.user.name, 'URL:', p.user.imageUrl || p.user.image_url);
                            }}
                          />
                          <AvatarFallback>
                            {p.user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        {/* Icon pensil hanya muncul pada avatar peserta lain, jika user saat ini facilitator */}
                        {isCurrentFacilitator && !isCurrentUser && (
                          <span className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow border cursor-pointer hover:bg-gray-50 transition-colors" title="Promote to Facilitator">
                            <Pen className="h-4 w-4 text-indigo-600" onClick={(e) => {
                              e.stopPropagation();
                              setShowRoleModal(true);
                              setSelectedParticipant(p);
                            }}/>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-900 mt-1 font-medium">{p.user.name}</span>
                      <span className="text-[11px] text-gray-500">{p.role ? 'Facilitator' : 'Participant'}</span>
                    </div>
                  );
                })}
              </div>
            )}




            {/* Form submit an idea di bawah avatar participants */}
            <Card className="bg-white rounded-xl w-full">
              <CardContent className="py-4 px-8">
                {/* Teks submit an idea di atas form, rata tengah */}
                <div className="w-full flex justify-center mb-2">
                  <span className="text-xs text-teal-600 font-semibold">Submit an idea!</span>
                </div>
                <form
                  className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full"
                  onSubmit={e => { e.preventDefault(); handleAdd(); }}
                >
                  <label className="font-medium mr-2 mb-1">Category:</label>
                  <select
                    className="w-32 px-3 pr-8 py-2 rounded-md border text-base"
                    value={inputCategory}
                    onChange={e => setInputCategory(e.target.value)}
                    disabled={isAddingItem}
                  >
                    <option value="format_1">{getCategoryDisplayName("format_1")}</option>
                    <option value="format_2">{getCategoryDisplayName("format_2")}</option>
                    <option value="format_3">{getCategoryDisplayName("format_3")}</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Ex. we have a linter!"
                    className="border rounded px-2 py-1 flex-1"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAddingItem}
                  />
                  <Button
                    onClick={handleAdd}
                    disabled={isAddingItem || !inputText.trim()}
                    className="px-4 py-1"
                    type="submit"
                  >
                    {isAddingItem ? "Adding..." : "Submit"}
                  </Button>
                  {isCurrentFacilitator && currentUserParticipant?.role && (
                  <Button
                    variant="secondary"
                    className="ml-2"
                    disabled={items.length === 0 || isPhaseChanging}
                    onClick={async () => {
                      setIsPhaseChanging(true);
                      try {
                        await broadcastPhaseChange('grouping');
                      } catch (error) {
                        console.error('Failed to change phase:', error);
                      } finally {
                        setIsPhaseChanging(false);
                      }
                    }}
                  >
                    {isPhaseChanging ? 'Starting Grouping...' : 'Grouping'}
                  </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }, [loading, error, retro, participants, user, currentUserRole, showShareModal, showRoleModal, selectedParticipant, isPromoting, isPhaseChanging, format, items, inputCategory, inputText, isAddingItem, isConnected, getCategoryDisplayName, getItemsByCategory, handleUpdateItem, handleDeleteItem, handleAdd, handleKeyDown, handleLogout, handlePromoteToFacilitator, broadcastPhaseChange]);

  
  // PHASE 2: Grouping (template)
  const GroupingPhase = useMemo(() => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <RetroHeader
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
      />
      {/* Area utama untuk grouping */}
      <div ref={areaRef} className="flex-1 relative bg-white overflow-hidden" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {/* Render item sebagai card kecil draggable */}
        {items.map((item, idx) => {
          const signature = itemGroups[item.id];
          const groupSize = signature ? Object.values(itemGroups).filter(sig => sig === signature).length : 0;
          let borderColor = highContrast ? '#000000' : '#e5e7eb';
          if (!highContrast && signature && groupSize > 1 && signatureColors[signature]) {
            borderColor = signatureColors[signature];
          }
          const pos = itemPositions[item.id] || { x: 200 + (idx % 3) * 220, y: 100 + Math.floor(idx / 3) * 70 };
          const isBeingDraggedByOthers = draggingByOthers[item.id];
          const draggingUser = participants.find(p => p.user.id === isBeingDraggedByOthers);
          
          return (
            // @ts-ignore
            <Draggable
              key={item.id}
              position={pos}
              onDrag={(e: any, data: any) => handleDrag(item.id, e, data)}
              onStop={(e: any, data: any) => handleStop(item.id, e, data)}
              bounds="parent"
            >
              <div
                id={'group-item-' + item.id}
                className={`px-3 py-2 bg-white border rounded shadow text-sm cursor-move select-none relative ${
                  isBeingDraggedByOthers ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
                style={{
                  minWidth: 80,
                  textAlign: 'center',
                  zIndex: isBeingDraggedByOthers ? 10 : 2,
                  border: `4px solid ${borderColor}`,
                  transition: 'border-color 0.2s',
                  position: 'absolute',
                }}
              >
                {item.content}
                {/* Indicator jika item sedang di-drag oleh user lain */}
                {isBeingDraggedByOthers && draggingUser && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {draggingUser.user.name} is dragging
                  </div>
                )}
              </div>
            </Draggable>
          );
        })}
        {/* High Contrast toggle kiri bawah (fixed) */}
        <div className="fixed left-4 bottom-4 flex items-center gap-2 z-10 bg-white border rounded px-2 py-1 shadow">
          <span className="text-gray-700 text-lg">
            <svg width="22" height="22" fill="none" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16V2z" fill="#222"/><circle cx="10" cy="10" r="8" stroke="#888" strokeWidth="2"/></svg>
          </span>
          <span className="text-base text-gray-900 font-medium">High Contrast</span>
          <label className="ml-2 relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
            <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:translate-x-4"></div>
          </label>
        </div>
        {/* Label bawah dan tombol kanan bawah */}
        <div className="absolute bottom-0 left-0 w-full flex items-center justify-between px-8 py-4 bg-white border-t z-20">
          {/* Toggle High Contrast di kiri */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-lg">
              <svg width="22" height="22" fill="none" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16V2z" fill="#222"/><circle cx="10" cy="10" r="8" stroke="#888" strokeWidth="2"/></svg>
            </span>
            <span className="text-base text-gray-900 font-medium">High Contrast</span>
            <label className="ml-2 relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:translate-x-4"></div>
            </label>
          </div>
          {/* Label tengah */}
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold">Grouping</div>
            <div className="text-xs text-gray-500">
              {(() => {
                const summary = getGroupSummary();
                return `${summary.totalGroups} groups, ${summary.totalGroupedItems} items grouped`;
              })()}
            </div>
          </div>
          {/* Tombol kanan */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-gray-600 border-gray-300"
              onClick={() => {
                const data = saveGroupData();
                // Data siap untuk disimpan ke database
                console.log('Data grup yang siap disimpan:', data);
              }}
            >
              Save Groups
            </Button>
            {isCurrentFacilitator && currentUserParticipant?.role && (
            <Button 
              className="bg-gray-400 text-white px-8 py-2 rounded" 
              style={{ minWidth: 180 }} 
              disabled={isPhaseChanging}
              onClick={async () => {
                setIsPhaseChanging(true);
                try {
                  await broadcastPhaseChange('labelling');
                } catch (error) {
                  console.error('Failed to change phase:', error);
                } finally {
                  setIsPhaseChanging(false);
                }
              }}
            >
              {isPhaseChanging ? 'Moving to Labelling...' : 'Group Labeling'}
            </Button>
            )}
          </div>
        </div>
      </div>
    </div>
    
  ), [retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout, items, itemPositions, highContrast, itemGroups, signatureColors, handleDrag, handleStop, getGroupSummary, saveGroupData, isPhaseChanging, broadcastPhaseChange, draggingByOthers]);

  // PHASE 3: Labelling (template, sesuai gambar)
  const LabellingPhase = useMemo(() => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <RetroHeader
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
      />
      {/* Group Board */}
      <div className="flex-1 flex flex-col items-center justify-start w-full">
        <div className="flex flex-row gap-8 mt-8 w-full justify-center">
          {[0, 1].map((groupIdx) => (
            <div key={groupIdx} className="bg-white border rounded-lg shadow-sm min-w-[350px] max-w-[400px] w-full p-4">
              <div className="mb-2">
                <input
                  className="w-full text-center text-gray-500 font-semibold bg-gray-100 rounded px-2 py-1 mb-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Optional Group Label"
                  maxLength={20}
                  value={groupLabels[groupIdx] || ""}
                  onChange={e => {
                    const val = e.target.value;
                    setGroupLabels(prev => {
                      const arr = [...prev];
                      arr[groupIdx] = val;
                      return arr;
                    });
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                {groupIdx === 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="happy">😀</span>
                      <span>asdasd Sasasdsadsad</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="sad">😢</span>
                      <span>asdasdczvxcv</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="happy">😀</span>
                      <span>vxvf</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Footer sticky ala submit phase */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t z-40 rounded-t-xl shadow-lg">
        <div className="container mx-auto px-4 py-4 flex flex-row items-center justify-between">
          {/* Judul dan deskripsi di kiri */}
          <div className="flex flex-col items-start justify-center">
            <div className="text-2xl font-semibold mb-1">Labelling</div>
            <div className="text-gray-500">Arrive at sensible group labels</div>
          </div>
          {/* Avatar peserta di tengah */}
          <div className="flex flex-row items-center gap-4">
            {participants.map((p) => {
              const isCurrentUser = user && p.user.id === user.id;
              const isCurrentFacilitator = participants.find(x => x.role)?.user.id === user?.id;
              return (
                <div key={p.id} className="flex flex-col items-center relative">
                  <div className="relative">
                    <Avatar
                      className={`h-14 w-14 border-2 ${p.role ? 'border-blue-500' : 'border-gray-200'} group-hover:border-indigo-500 transition`}
                      title={`${p.user.name} ${p.role ? '(Facilitator)' : '(Participant)'}`}
                    >
                      {typeof (p.user as any)["image_url"] === "string" ? (
                        <AvatarImage src={(p.user as any)["image_url"]} alt={p.user.name} />
                      ) : (
                        <AvatarFallback>
                          {p.user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isCurrentFacilitator && !isCurrentUser && (
                      <span className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow border cursor-pointer" title="Promote to Facilitator">
                        <Pen className="h-4 w-4 text-indigo-600" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-900 mt-1 font-medium">{p.user.name}</span>
                  <span className="text-[11px] text-gray-500">{p.role ? 'Facilitator' : 'Participant'}</span>
                </div>
              );
            })}
          </div>
          {/* Tombol Voting di kanan */}
          <Button
            variant="secondary"
            className="px-8 py-2 rounded text-base font-semibold"
            style={{ minWidth: 180 }}
            onClick={() => setPhase('voting')}
          >
            Voting
          </Button>
        </div>
      </div>
    </div>
  ), [retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout, setPhase, groupLabels, setGroupLabels]);

  // PHASE 4: Voting (template)
  const [userVotes, setUserVotes] = useState<{ [groupIdx: number]: number }>({});
  const maxVotes = 3;
  const totalVotesUsed = Object.values(userVotes).reduce((a, b) => a + b, 0);
  const votesLeft = maxVotes - totalVotesUsed;

  const handleVote = (groupIdx: number, delta: number) => {
    setUserVotes(prev => {
      const current = prev[groupIdx] || 0;
      let next = current + delta;
      // Tidak boleh kurang dari 0, tidak boleh lebih dari sisa vote
      if (next < 0) next = 0;
      if (delta > 0 && votesLeft <= 0) return prev;
      // Tidak boleh lebih dari maxVotes per user
      if (totalVotesUsed + delta > maxVotes) return prev;
      return { ...prev, [groupIdx]: next };
    });
  };

  const VotingPhase = useMemo(() => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <RetroHeader
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
      />
      {/* Group Board */}
      <div className="flex-1 flex flex-col items-center justify-start w-full">
        <div className="flex flex-row gap-8 mt-8 w-full justify-center">
          {[0, 1].map((groupIdx) => (
            <div key={groupIdx} className="bg-white border rounded-lg shadow-sm min-w-[350px] max-w-[400px] w-full p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-400">{groupLabels[groupIdx]?.trim() || 'Unlabeled'}</span>
                <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      <div className="bg-teal-400 text-white font-bold pl-4 pr-2 py-1 rounded-lg relative select-none text-left" style={{fontSize: '1rem', minWidth: '90px'}}>
                        <span className="relative z-10">Vote! &gt; &gt; </span>
                      </div>
                    </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 px-0"
                    onClick={() => handleVote(groupIdx, -1)}
                    disabled={(userVotes[groupIdx] || 0) <= 0}
                  >
                    –
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 px-0"
                    onClick={() => handleVote(groupIdx, 1)}
                    disabled={votesLeft <= 0}
                  >
                    +
                  </Button>
                  <span className="w-5 text-center font-semibold">{userVotes[groupIdx] || 0}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {groupIdx === 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="happy">😀</span>
                      <span>asdasd Sasasdsadsad</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="sad">😢</span>
                      <span>asdasdczvxcv</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="happy">😀</span>
                      <span>vxvf</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Footer sticky ala submit phase */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t z-40 rounded-t-xl shadow-lg">
        <div className="container mx-auto px-4 py-4 flex flex-row items-center justify-between">
          {/* Kiri: Voting: X Votes Left */}
          <div className="flex flex-col items-start justify-center">
            <div className="text-xl font-semibold">Voting: {votesLeft} Votes Left</div>
          </div>
          {/* Tengah: Avatar peserta */}
          <div className="flex flex-row items-center gap-4">
            {participants.map((p) => {
              const isCurrentUser = user && p.user.id === user.id;
              const isCurrentFacilitator = participants.find(x => x.role)?.user.id === user?.id;
              return (
                <div key={p.id} className="flex flex-col items-center relative">
                  <div className="relative">
                    <Avatar
                      className={`h-14 w-14 border-2 ${p.role ? 'border-blue-500' : 'border-gray-200'} group-hover:border-indigo-500 transition`}
                      title={`${p.user.name} ${p.role ? '(Facilitator)' : '(Participant)'}`}
                    >
                      {typeof (p.user as any)["image_url"] === "string" ? (
                        <AvatarImage src={(p.user as any)["image_url"]} alt={p.user.name} />
                      ) : (
                        <AvatarFallback>
                          {p.user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isCurrentFacilitator && !isCurrentUser && (
                      <span className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow border cursor-pointer" title="Promote to Facilitator">
                        <Pen className="h-4 w-4 text-indigo-600" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-900 mt-1 font-medium">{p.user.name}</span>
                  <span className="text-[11px] text-gray-500">{p.role ? 'Facilitator' : 'Participant'}</span>
                </div>
              );
            })}
          </div>
          {/* Kanan: Tombol Action Items */}
          <Button
            variant="secondary"
            className="px-8 py-2 rounded text-base font-semibold"
            style={{ minWidth: 180 }}
            onClick={() => setPhase('ActionItems')}
            disabled={votesLeft !== 0}
          >
            Action Items
          </Button>
        </div>
      </div>
    </div>
  ), [retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout, setPhase, groupLabels, userVotes, votesLeft]);

  // PHASE 5: Action Items (template)
  const ActionItemsPhase = useMemo(() => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <RetroHeader
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
      />
      {/* Main Content */}
      <div className="w-full flex flex-row">
        {/* Card group kiri */}
        <div className="flex flex-row gap-6 p-8 items-start flex-1">
          {[0, 1].map((groupIdx) => (
            <div key={groupIdx} className="bg-white border rounded-lg shadow-sm w-auto min-w-[220px] max-w-[350px] px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-400">{groupLabels[groupIdx]?.trim() || 'Unlabeled'}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded select-none text-center" style={{fontSize: '1rem', minWidth: '60px'}}>
                    Votes {userVotes[groupIdx] || 0}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {groupIdx === 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="happy">😀</span>
                      <span>vxvf</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="happy">😀</span>
                      <span>asdasd Sasasdsadsad</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <span role="img" aria-label="sad">😢</span>
                      <span>asdasdczvxcv</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Panel Action Items sticky kanan */}
        <div className="w-[400px] border-l bg-white flex flex-col p-6 sticky top-0 self-start overflow-y-auto" style={{ height: 'calc(100vh - 80px)', right: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-semibold">Action Items</span>
          </div>
          <hr className="mb-4" />
          {/* List action items kosong (dummy) */}
        </div>
      </div>
      {/* Footer ala submit/ideation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t z-40">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full">
          {/* Dropdown assignee */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="font-medium mr-2 mb-1">Assignee:</label>
            <select className="w-64 px-3 pr-8 py-2 rounded-md border text-base">
              {participants.length > 0 ? (
                participants.map((p) => (
                  <option key={p.user.id} value={p.user.id}>{p.user.name}</option>
                ))
              ) : (
                <option>No participants</option>
              )}
            </select>
          </div>
          {/* Input action item */}
          <input
            type="text"
            placeholder="Ex. automate the linting process"
            className="border rounded px-2 py-1 flex-1"
          />
          {/* Tombol Submit dan Send Action Items */}
          <Button
            className="px-4 py-1 bg-teal-200 text-white hover:bg-teal-300"
            style={{ minWidth: 100 }}
          >
            Submit
          </Button>
          <Button
            variant="secondary"
            className="ml-2 bg-blue-300 text-white hover:bg-blue-400"
            style={{ minWidth: 180 }}
            disabled
          >
            Send Action Items
          </Button>
        </div>
      </div>
    </div>
  ), [retro, participants, user, currentUserRole, showShareModal, setShowShareModal, handleLogout, setPhase, groupLabels, userVotes]);

  // PHASE 6: Final (read only, retro selesai)
  const FinalPhase = useMemo(() => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Retro Selesai (Read Only)</h2>
      <p className="text-gray-600">This page is read only. Retro has been completed.</p>
    </div>
  ), []);

  // Phase switching
  if (phase === 'submit') return SubmitPhase;
  if (phase === 'grouping') return GroupingPhase;
  if (phase === 'labelling') return LabellingPhase;
  if (phase === 'voting') return VotingPhase;
  if (phase === 'ActionItems') return ActionItemsPhase;
  if (phase === 'final') return FinalPhase;
   
  // Fallback loading
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading retrospective...</p>
      </div>
    </div>
  );
}

// Komponen header reusable
function RetroHeader({
  retro,
  participants,
  user,
  currentUserRole,
  showShareModal,
  setShowShareModal,
  handleLogout,
}: {
  retro: Retro | null;
  participants: Participant[];
  user: any;
  currentUserRole: boolean;
  showShareModal: boolean;
  setShowShareModal: (v: boolean) => void;
  handleLogout: () => void;
}) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{retro?.title ?? ''}</h1>
              <div className="flex items-center space-x-4 mt-1">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{participants.length} participants</span>
                </Badge>
                {retro && (retro as any).duration && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{(retro as any).duration} min</span>
                  </Badge>
                )}
                <Badge variant={retro?.status === "draft" ? "default" : "secondary"}>{retro?.status ?? ''}</Badge>
                {currentUserRole && (
                  <Badge variant="default" className="bg-blue-500">
                    Facilitator
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowShareModal(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={typeof (user as any)["image_url"] === "string" ? (user as any)["image_url"] : undefined} alt={user.name} />
                      <AvatarFallback>
                        {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
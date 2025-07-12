import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeedbackCard } from "@/components/feedback-card"
import { ArrowLeft, Users, Clock, Share2 } from "lucide-react"
import { Link } from "react-router-dom"
import { apiService, Retro, RetroItem, Participant, LabelsGroup } from "@/services/api"

// Interface untuk data grup
interface GroupData {
  groups: Array<{
    groupId: string;
    itemIds: string[];
  }>;
}

interface DatabaseGroupData {
  retroId: string;
  groups: Array<{
    groupId: string;
    itemIds: string[];
  }>; 
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
import { LogOut, User, Pen, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Draggable from 'react-draggable';
import { Label } from "recharts"
import SubmitPhase from './phases/SubmitPhase';
import GroupingPhase from './phases/GroupingPhase';
import LabellingPhase from './phases/LabellingPhase';
import VotingPhase from './phases/VotingPhase';
import ActionItemsPhase from './phases/ActionItemsPhase';
import FinalPhase from './phases/FinalPhase';
import RetroHeader from './RetroHeader';

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
  });

  // Promote to Facilitator Confirmation
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  const [labelsGroups, setLabelsGroups] = useState<LabelsGroup[]>([]);
  const [labellingItems, setLabellingItems] = useState<{ [label: string]: RetroItem[] }>({});

  // 1. State for typing participants
  const [typingParticipants, setTypingParticipants] = useState<string[]>([]);

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
      return {
        groupId: `group_${signature}_${Date.now()}_${index}`,
        itemIds: itemIds,
      };
    });

    return {
      groups: groups,
    };
  }, [itemGroups, signatureColors]);

  // Fungsi untuk menyimpan data grup ke database (kirim satu per satu)
  const saveGroupData = useCallback(async () => {
    const dataToSave = convertGroupsToDatabaseFormat();
    setGroupData(dataToSave);
    console.log('💾 Data grup yang akan disimpan:', dataToSave);

    for (const [groupIndex, group] of dataToSave.groups.entries()) {
      for (const itemId of group.itemIds) {
        const payload = {
          retro_id: retroId,
          label: `Group ${groupIndex + 1}`,
          item_id: itemId,
        };
        console.log('📤 Sending to API:', payload);
        try {
          await apiService.createLabelGroup(retroId, payload);
          console.log('✅ Data berhasil dikirim:', payload);
        } catch (error) {
          console.error('❌ Gagal mengirim data:', payload, error);
        }
      }
    }
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

  useEffect(() => {
    if (phase === 'labelling') {
      apiService.getLabelsByRetro(retroId).then((groups) => {
        setLabelsGroups(groups);
        // Kelompokkan item per group label
        const groupMap: { [label: string]: RetroItem[] } = {};
        groups.forEach((g) => {
          const label = g.label || `Group`;
          if (!groupMap[label]) groupMap[label] = [];
          const item = items.find((it: RetroItem) => it.id === (g as any).item_id);
          if (item) groupMap[label].push(item);
        });
        setLabellingItems(groupMap);
      });
    }
  }, [phase, retroId, items]);

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

  // 2. Listen for typing events from socket
  useEffect(() => {
    if (!socket) return;
    const handleTyping = (data: { userId: string }) => {
      setTypingParticipants((prev) => {
        if (prev.includes(data.userId)) return prev;
        return [...prev, data.userId];
      });
      // Remove after 2s
      setTimeout(() => {
        setTypingParticipants((prev) => prev.filter((id) => id !== data.userId));
      }, 2000);
    };
    socket.on('typing', handleTyping);
    return () => { socket.off('typing', handleTyping); };
  }, [socket]);

  // 3. Emit typing event when user types in input (contoh untuk inputText)
  const handleInputTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socket && user) {
      socket.emit('typing', { retroId, userId: user.id });
    }
  };

  const [userVotes, setUserVotes] = useState<{ [groupIdx: number]: number }>({});
  const maxVotes = 3;
  const totalVotesUsed = Object.values(userVotes).reduce((a, b) => a + b, 0);
  const votesLeft = maxVotes - totalVotesUsed;
  const handleVote = (groupIdx: number, delta: number) => {
    setUserVotes(prev => {
      const current = prev[groupIdx] || 0;
      let next = current + delta;
      if (next < 0) next = 0;
      if (delta > 0 && votesLeft <= 0) return prev;
      if (totalVotesUsed + delta > maxVotes) return prev;
      return { ...prev, [groupIdx]: next };
    });
  };
  const [actionItems, setActionItems] = useState<{ assignee: string; assigneeName: string; task: string; edited?: boolean }[]>([]);
  const [actionInput, setActionInput] = useState('');
  const [actionAssignee, setActionAssignee] = useState(participants[0]?.user.id || '');
  const [editingActionIdx, setEditingActionIdx] = useState<number | null>(null);
  const [editActionInput, setEditActionInput] = useState('');
  const [editActionAssignee, setEditActionAssignee] = useState('');
  const handleAddActionItem = () => {
    if (!actionInput.trim() || !actionAssignee) return;
    const assigneeObj = participants.find(p => p.user.id === actionAssignee);
    setActionItems(prev => [
      ...prev,
      {
        assignee: actionAssignee,
        assigneeName: assigneeObj ? assigneeObj.user.name : 'Unknown',
        task: actionInput.trim(),
      },
    ]);
    setActionInput('');
  };
  const handleEditActionItem = (idx: number) => {
    const item = actionItems[idx];
    setEditingActionIdx(idx);
    setEditActionInput(item.task);
    setEditActionAssignee(item.assignee);
  };
  const handleSaveEditActionItem = (idx: number) => {
    if (!editActionInput.trim() || !editActionAssignee) return;
    const assigneeObj = participants.find(p => p.user.id === editActionAssignee);
    setActionItems(prev => prev.map((item, i) =>
      i === idx
        ? {
            ...item,
            assignee: editActionAssignee,
            assigneeName: assigneeObj ? assigneeObj.user.name : 'Unknown',
            task: editActionInput.trim(),
            edited: true,
          }
        : item
    ));
    setEditingActionIdx(null);
  };
  const handleDeleteActionItem = (idx: number) => {
    setActionItems(prev => prev.filter((_, i) => i !== idx));
  };


  // Phase switching
  if (phase === 'submit') return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <SubmitPhase
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
        isCurrentFacilitator={isCurrentFacilitator}
        currentUserParticipant={currentUserParticipant}
        inputCategory={inputCategory}
        setInputCategory={setInputCategory}
        inputText={inputText}
        handleInputTextChange={handleInputTextChange}
        handleKeyDown={handleKeyDown}
        isAddingItem={isAddingItem}
        handleAdd={handleAdd}
        items={items}
        getCategoryDisplayName={getCategoryDisplayName}
        typingParticipants={typingParticipants}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        updatingItemId={updatingItemId}
        handleUpdateItem={handleUpdateItem}
        handleDeleteItem={handleDeleteItem}
        broadcastPhaseChange={broadcastPhaseChange}
        setPhase={setPhase}
      />
    </>
  );
  if (phase === 'grouping') return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <GroupingPhase
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
        items={items}
        itemPositions={itemPositions}
        highContrast={highContrast}
        itemGroups={itemGroups}
        signatureColors={signatureColors}
        handleDrag={handleDrag}
        handleStop={handleStop}
        getGroupSummary={getGroupSummary}
        saveGroupData={saveGroupData}
        isPhaseChanging={isPhaseChanging}
        broadcastPhaseChange={broadcastPhaseChange}
        draggingByOthers={draggingByOthers}
        isCurrentFacilitator={isCurrentFacilitator}
        currentUserParticipant={currentUserParticipant}
        typingParticipants={typingParticipants}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        setPhase={setPhase}
      />
    </>
  );
  if (phase === 'labelling') return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <LabellingPhase
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
        labellingItems={labellingItems}
        isCurrentFacilitator={isCurrentFacilitator}
        typingParticipants={typingParticipants}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        setPhase={setPhase}
        broadcastPhaseChange={broadcastPhaseChange}
        groupLabels={groupLabels}
        setGroupLabels={setGroupLabels}
      />
    </>
  );
  if (phase === 'voting') return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <VotingPhase
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
        labellingItems={labellingItems}
        isCurrentFacilitator={isCurrentFacilitator}
        typingParticipants={typingParticipants}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        setPhase={setPhase}
        broadcastPhaseChange={broadcastPhaseChange}
        groupLabels={groupLabels}
        userVotes={userVotes}
        votesLeft={votesLeft}
        handleVote={handleVote}
      />
    </>
  );
  if (phase === 'ActionItems') return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <ActionItemsPhase
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
        groupLabels={groupLabels}
        userVotes={userVotes}
        actionItems={actionItems}
        actionInput={actionInput}
        actionAssignee={actionAssignee}
        setActionInput={setActionInput}
        setActionAssignee={setActionAssignee}
        handleAddActionItem={handleAddActionItem}
        isCurrentFacilitator={isCurrentFacilitator}
        setPhase={setPhase}
        broadcastPhaseChange={broadcastPhaseChange}
        typingParticipants={typingParticipants}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        editingActionIdx={editingActionIdx}
        editActionInput={editActionInput}
        editActionAssignee={editActionAssignee}
        setEditingActionIdx={setEditingActionIdx}
        setEditActionInput={setEditActionInput}
        setEditActionAssignee={setEditActionAssignee}
        handleEditActionItem={handleEditActionItem}
        handleSaveEditActionItem={handleSaveEditActionItem}
        handleDeleteActionItem={handleDeleteActionItem}
      />
    </>
  );
  if (phase === 'final') return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <FinalPhase
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
        groupLabels={groupLabels}
        userVotes={userVotes}
        actionItems={actionItems}
        typingParticipants={typingParticipants}
        isCurrentFacilitator={isCurrentFacilitator}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
      />
    </>
  );
  // Fallback loading
  return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading retrospective...</p>
        </div>
      </div>
    </>
  );
}

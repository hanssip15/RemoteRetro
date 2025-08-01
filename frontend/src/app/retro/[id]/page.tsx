import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiService, Retro, RetroItem, Participant, GroupsData, api , User} from "@/services/api"

// Interface untuk data grup


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

import PrimeDirectivePhase from './phases/PrimeDirectivePhase';
import IdeationPhase from './phases/IdeationPhase';
import GroupingPhase from './phases/GroupingPhase';
import LabellingPhase from './phases/LabellingPhase';
import VotingPhase from './phases/VotingPhase';
import ActionItemsPhase from './phases/ActionItemsPhase';
import FinalPhase from './phases/FinalPhase';
import RetroLobbyPage from './lobby/page';

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
  const [user, setUser] = useState<User | null>(null)
  const [isPhaseChanging] = useState(false);
  const [phase, setPhase] = useState<'lobby' | 'prime-directive' | 'ideation' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems'>('lobby');
  const [itemPositions, setItemPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
  const [itemGroups, setItemGroups] = useState<{ [key: string]: string }>({}); // itemId -> signature
  const [highContrast, setHighContrast] = useState(false);
  const [groupLabels, setGroupLabels] = useState<string[]>(["", ""]); // contoh 2 group
  const [allUserVotes, setAllUserVotes] = useState<{ [userId: string]: { [groupIdx: number]: number } }>({});
  const [userId, setUserId] = useState<string>();
  const [isUserJoined, setIsUserJoined] = useState(false);
  
  // Data structure untuk menyimpan grup yang bisa dimasukkan ke database
  // const [setGroupData] = useState<GroupData>({
  //   groups: [],
  // });

  loading
  error
  format
  isUpdatingItem
  isDeletingItem
  
  // Promote to Facilitator Confirmation
  // @ts-ignore
  const [setShowRoleModal] = useState(false);
  const [setSelectedParticipant] = useState<Participant | null>(null);

  const [labellingItems, setLabellingItems] = useState<GroupsData[]>([]);
  const [typingParticipants, setTypingParticipants] = useState<string[]>([]);
  const typingTimeouts = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  // State untuk tracking item yang sedang di-drag oleh user lain
  const [draggingByOthers, setDraggingByOthers] = useState<{ [itemId: string]: string }>({});

  // Debouncing mechanism untuk grouping updates
  const groupingUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingGroupingUpdateRef = useRef<{
    itemToGroup: { [id: string]: string };
    newSignatureColors: { [signature: string]: string };
    newUsedColors: string[];
  } | null>(null);

  // State locking mechanism untuk mencegah race condition
  const isUpdatingGroupsRef = useRef(false);
  const pendingStateUpdatesRef = useRef<Array<{
    itemToGroup: { [id: string]: string };
    newSignatureColors: { [signature: string]: string };
    newUsedColors: string[];
  }>>([]);

  // Timestamp-based conflict resolution
  const lastGroupingUpdateRef = useRef<number>(0);
  const groupingUpdateVersionRef = useRef<number>(0);

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



  useEffect(() => {
  const fetchUser = async () => {
    try {
      
        const userData = await api.getCurrentUser();
        if (!userData) {
          api.removeAuthToken(); 
          navigate('/login');
        return;
        }
        setUser(userData);
        setUserId(userData.id);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user. Please try again.');
      await api.removeAuthToken();
      navigate('/login');
    }
  };

  fetchUser();
}, []);

// Cek join status setiap kali participants berubah
useEffect(() => {
  if (user && participants && participants.length > 0) {
    const currentUserParticipant = participants.find((p) => p.user.id === user.id);
    
    if (currentUserParticipant && !isUserJoined) {
      setIsUserJoined(true);
      setLoading(false);
    }
  }
}, [user, participants, isUserJoined]);

// Timeout fallback untuk mencegah loading yang terlalu lama
useEffect(() => {
  if (user && !isUserJoined) {
    const timeout = setTimeout(() => {
      window.location.reload();
      setIsUserJoined(true);
    }, 3000); // 3 detik timeout

    return () => clearTimeout(timeout);
  }
}, [user, isUserJoined]);
  // Pewarnaan group: connected components + warna primary group stabil dengan signature
  function computeGroupsAndColors(
    items: RetroItem[],
    // @ts-ignore
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
    // 1. Buat semua group dulu di backend
    // const createdGroups = [];
    for (const group of dataToSave.groups) {
      try {
        const createdGroup = await apiService.createGroup(retroId, {
          label: 'unlabeled',
          votes: 0,
        }) as any;
        for (const itemId of group.itemIds) {
        // @ts-ignore
          const createdGroupItem = await apiService.createGroupItem(createdGroup.id, itemId) as any;
        }
        // createdGroups.push({ ...createdGroup, items: group.itemIds });
      } catch (error) {
        console.error('❌ Gagal membuat group:', group, error);
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
  // @ts-ignore
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
        
        // Use debounced grouping update to prevent race conditions
        debouncedGroupingUpdate(itemToGroup, newSignatureColors, newUsedColors);
      }, 50); // Slightly longer delay to ensure DOM is updated
      
      return newPos;
    });
  };
  // @ts-ignore
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
      
      // Use debounced grouping update to prevent race conditions
      debouncedGroupingUpdate(itemToGroup, newSignatureColors, newUsedColors);
    }, 100);
  };

  

  // Load phase from retro data when component mounts or retro changes
  useEffect(() => {
    if (retro?.currentPhase) {
      let mappedPhase = retro.currentPhase;
      if (retro.currentPhase === 'submit') {
        mappedPhase = 'ideation';
      }
      setPhase(mappedPhase as typeof phase);
    } else if (retro?.status === 'draft') {
      setPhase('lobby');
    } else {
      setPhase('prime-directive');
    }
  }, [retro?.currentPhase, retro?.status]);

  useEffect(() => {
    if (phase === 'labelling') {
      apiService.getLabelsByRetro(retroId).then((groups) => {
        setLabellingItems(groups);
      }).catch((error) => {
        console.error('❌ Error fetching labelling items:', error);
        setLabellingItems([]);
      });
    }
  }, [phase, retroId, items]);

  useEffect(() => {
    if (phase === 'voting') {
      apiService.getLabelsByRetro(retroId).then((groups) => {
        setLabellingItems(groups);
      }).catch((error) => {
        console.error('❌ Error fetching labelling items:', error);
        setLabellingItems([]);
      });
    }
  }, [phase, retroId, items]);

  // Add useEffect for ActionItems phase to ensure labellingItems are loaded
  useEffect(() => {
    if (phase === 'ActionItems') {
      apiService.getLabelsByRetro(retroId).then((groups) => {
        setLabellingItems(groups);
      }).catch((error) => {
        console.error('❌ Error fetching labelling items for ActionItems:', error);
        setLabellingItems([]);
      });
    }
  }, [phase, retroId]);

  useEffect(() => {
    if (phase === 'final') {
      
      apiService.getLabelsByRetro(retroId).then((groups) => {
        setLabellingItems(groups);
      }).catch((error) => {
        console.error('❌ Error fetching labelling items for ActionItems:', error);
        setLabellingItems([]);
      });
      apiService.getAction(retroId).then((item) => {
        setActionItems(item);
      }).catch((error) => {
        console.error('❌ Error fetching labelling items for ActionItems:', error);
        setLabellingItems([]);
      });
      console.log('✅ Action items loaded for final phase');
      console.log('actionItems:', actionItems);
      console.log('actionItems length:', actionItems.length);
    }
  }, [phase, retroId]);
  

  const currentUserRole = participants.find(p => p.user.id === user?.id)?.role || false;
  
 

  // Memoize WebSocket handlers to prevent unnecessary re-renders
  const handleItemAdded = useCallback((newItem: RetroItem) => {
    
    setItems(prev => {
      // Check if item already exists to avoid duplicates
      const exists = prev.find(item => item.id === newItem.id);
      if (exists) {
        return prev;
      }
      
      // Check if we have an optimistic item with same content
      const optimisticItem = prev.find(item => 
        item.id.startsWith('temp-') && 
        item.content === newItem.content &&
        item.category === newItem.category
      );
      
      if (optimisticItem) {
        return prev.map(item => item.id === optimisticItem.id ? newItem : item);
      }
      
      const newItems = [...prev, newItem];
      return newItems;
    });
  }, [items.length]);

  

  const handleItemUpdated = useCallback((updatedItem: RetroItem) => {
    setItems(prev => prev.map(item => {
      if (item.id === updatedItem.id) {
        // Check if we have an optimistic update for this item
        const optimisticUpdate = optimisticUpdates[updatedItem.id];
        if (optimisticUpdate) {
          // We have an optimistic update, ignore WebSocket update
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
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleItemsUpdate = useCallback((newItems: RetroItem[]) => {
    setItems(newItems);
  }, []);

  // const handleParticipantUpdate = useCallback(() => {
  //   // Refresh participants data
  //   fetchRetroData();
  // }, []);

  const handlePhaseChange = useCallback((newPhase: 'prime-directive' | 'ideation' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems') => {
    setPhase(newPhase);
    // Don't set isPhaseChanging to false here as it's handled by the button
  }, []);

  // Handler untuk menerima posisi item dari partisipan lain
  const handleItemPositionUpdate = useCallback((data: { 
    itemId?: string; 
    position?: { x: number; y: number }; 
    itemPositions?: { [itemId: string]: { x: number; y: number } };
    userId: string 
  }) => {
    // Hanya update jika bukan dari user saat ini
    if (data.userId !== user?.id) {
      // Handle multiple item positions (for initialization)
      if (data.itemPositions) {
        setItemPositions(prev => ({ ...prev, ...data.itemPositions }));
      }
      // Handle single item position (for dragging)
      else if (data.itemId && data.position) {
        setItemPositions(pos => ({ ...pos, [data.itemId!]: data.position! }));
        // Set item sebagai sedang di-drag oleh user lain
        setDraggingByOthers(prev => ({ ...prev, [data.itemId!]: data.userId }));
        
        // Clear dragging state setelah 2 detik
        setTimeout(() => {
          setDraggingByOthers(prev => {
            const newState = { ...prev };
            delete newState[data.itemId!];
            return newState;
          });
        }, 2000);
      }
    }
  }, [user?.id]);

  // Handler untuk menerima grouping update dari partisipan lain
  const handleGroupingUpdate = useCallback((data: { 
    itemGroups: { [itemId: string]: string }; 
    signatureColors: { [signature: string]: string };
    userId: string;
    timestamp?: string;
    version?: number;
  }) => {
    // Hanya update jika bukan dari user saat ini
    if (data.userId !== user?.id) {
      const updateTime = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
      const updateVersion = data.version || 0;
      
      // Timestamp-based conflict resolution
      if (updateTime > lastGroupingUpdateRef.current || 
          (updateTime === lastGroupingUpdateRef.current && updateVersion > groupingUpdateVersionRef.current)) {
        
        lastGroupingUpdateRef.current = updateTime;
        groupingUpdateVersionRef.current = updateVersion;
        
        setItemGroups(data.itemGroups);
        setSignatureColors(data.signatureColors);
      }
    }
  }, [user?.id]);

  // Handler untuk menerima label update dari facilitator lain
  const handleLabelUpdate = useCallback((data: { 
    groupId: number; 
    label: string; 
    userId: string 
  }) => {
    // Hanya update jika bukan dari user saat ini
    if (data.userId !== user?.id) {
      setLabellingItems(prev => 
        prev.map(group => 
          group.id === data.groupId 
            ? { ...group, label: data.label }
            : group
        )
      );
    }
  }, [user?.id]);

  // Handler untuk menerima vote update dari participant lain
  const handleVoteUpdate = useCallback((data: { 
    groupId: number; 
    votes: number; 
    userId: string;
    userVotes: { [groupId: number]: number };
  }) => {
    // Hanya update jika bukan dari user saat ini
    if (data.userId !== user?.id) { 
      setLabellingItems(prev => 
        prev.map(group => 
          group.id === data.groupId 
            ? { ...group, votes: data.votes }
            : group
        )
      );
    }
  }, [user?.id]);


  // Handler untuk menerima vote submission dari facilitator
  const handleVoteSubmission = useCallback((data: { 
    facilitatorId: string; 
    groupVotes: { [groupId: number]: number };
  }) => {
    // Update semua votes sesuai dengan yang disimpan facilitator
    setLabellingItems(prev => 
      prev.map(group => 
        group.id && data.groupVotes[group.id] !== undefined
          ? { ...group, votes: data.groupVotes[group.id] }
          : group
      )
    );
  }, []);

  // Handler untuk menerima action items update dari WebSocket
  const handleActionItemsUpdate = useCallback((actionItems: any[]) => {
    
    
    // Pastikan hanya update dari WebSocket, bukan dari local state
    setActionItems(actionItems);
    
  }, []);

  // Handler untuk menerima retro state yang berisi action items
  const handleRetroState = useCallback((state: any) => {
    
    if (state.actionItems) {
      setActionItems(state.actionItems);
    }
  }, []);

  // Initialize WebSocket connection using the stable hook
  const { isConnected, socket } = useRetroSocket({
    retroId,
    userId: userId!,
    onItemAdded: handleItemAdded,
    onItemUpdated: handleItemUpdated,
    onItemDeleted: handleItemDeleted,
    onItemsUpdate: handleItemsUpdate,
    onParticipantUpdate: async () => {
      // Fetch ulang data partisipan dari backend dan update state di RetroPage
      try {
        const data = await apiService.getRetro(retroId);
        const activeParticipants = data.participants.filter((p: any) => p.isActive === true);
        setParticipants(activeParticipants);
      } catch (e) {
        console.error('❌ Error updating participants:', e);
      }
    },
    onPhaseChange: handlePhaseChange,
    onItemPositionUpdate: handleItemPositionUpdate,
    onGroupingUpdate: handleGroupingUpdate,
    onLabelUpdate: handleLabelUpdate,
    onVoteUpdate: handleVoteUpdate,
    onVoteSubmission: handleVoteSubmission,
    onActionItemsUpdate: handleActionItemsUpdate,
    onRetroState: handleRetroState,
  });

  // Debounced grouping update function - now with access to socket and isConnected
  const debouncedGroupingUpdate = useCallback((itemToGroup: { [id: string]: string }, newSignatureColors: { [signature: string]: string }, newUsedColors: string[]) => {
    // Cancel previous timeout
    if (groupingUpdateTimeoutRef.current) {
      clearTimeout(groupingUpdateTimeoutRef.current);
    }

    // Store pending update
    pendingGroupingUpdateRef.current = {
      itemToGroup,
      newSignatureColors,
      newUsedColors
    };

    // Set new timeout
    groupingUpdateTimeoutRef.current = setTimeout(() => {
      if (pendingGroupingUpdateRef.current) {
        const { itemToGroup, newSignatureColors, newUsedColors } = pendingGroupingUpdateRef.current;
        
        // State locking mechanism
        if (isUpdatingGroupsRef.current) {
          // If already updating, queue this update
          pendingStateUpdatesRef.current.push({
            itemToGroup,
            newSignatureColors,
            newUsedColors
          });
          return;
        }

        // Lock state updates
        isUpdatingGroupsRef.current = true;
        
        // Update local state
        setItemGroups(itemToGroup);
        setSignatureColors(newSignatureColors);
        setUsedColors(newUsedColors);
        
        // Broadcast grouping update to other users with timestamp and version
        if (socket && isConnected && user) {
          const currentTime = Date.now();
          const currentVersion = groupingUpdateVersionRef.current + 1;
          groupingUpdateVersionRef.current = currentVersion;
          
          socket.emit('grouping-update', {
            retroId: retroId,
            itemGroups: itemToGroup,
            signatureColors: newSignatureColors,
            userId: user.id,
            timestamp: new Date(currentTime).toISOString(),
            version: currentVersion
          });
        }
        
        // Clear pending update
        pendingGroupingUpdateRef.current = null;
        
        // Unlock after a short delay to allow state to settle
        setTimeout(() => {
          isUpdatingGroupsRef.current = false;
          
          // Process any queued updates
          if (pendingStateUpdatesRef.current.length > 0) {
            const nextUpdate = pendingStateUpdatesRef.current.shift();
            if (nextUpdate) {
              debouncedGroupingUpdate(nextUpdate.itemToGroup, nextUpdate.newSignatureColors, nextUpdate.newUsedColors);
            }
          }
        }, 50);
      }
    }, 150); // Increased delay for better stability
  }, [socket, isConnected, user, retroId]);


  useEffect(() => {
  if (socket && retroId && user) {
    // Minta data userVotes saat halaman di-load atau socket connect
    socket.emit('request-user-votes', {
      retroId,
      userId: user.id
    });

    // Terima hasil userVotes
    socket.on(`user-votes:${retroId}:${user.id}`, (data: { userVotes: { [groupId: number]: number } }) => {
      if (data && data.userVotes) {
        setUserVotes(data.userVotes);
      }
    });

    // Cleanup listener saat komponen unmount
    return () => {
      socket.off(`user-votes:${retroId}:${user.id}`);
    };
  }
}, [socket, retroId, user]);


 

  // Fungsi untuk mengirim phase change ke semua partisipan
  const broadcastPhaseChange = useCallback(async (newPhase: 'prime-directive' | 'ideation' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems') => {
    if (!user?.id) {
      console.error('❌ No user ID available for phase change');
      return;
    }

    try {
      // Jika phase berubah ke labelling, simpan data grouping terlebih dahulu
      if (newPhase === 'labelling') {
        await saveGroupData(); 
      }      
      await apiService.updatePhase(retroId, newPhase);
      
      // Phase change will be broadcasted via WebSocket from the server
      
    } catch (error) {
      console.error('❌ Failed to update phase:', error);
      setError('Failed to change phase. Please try again.');
    }
  }, [retroId, user?.id, saveGroupData]);

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
      setParticipants(data.participants.filter((p: any) => p.isActive === true))
      
      // Cek apakah current user sudah ada di dalam participants
      if (user) {
        const currentUserParticipant = data.participants.find((p: any) => p.user.id === user.id);
        if (currentUserParticipant) {
          setIsUserJoined(true);
          setLoading(false);
        } else {
          // Tetap loading sampai user berhasil join
          setIsUserJoined(false);
          setLoading(true);
        }
      }
    } catch (error) {
      console.error("Error fetching retro data:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to fetch retro data: ${errorMessage}`)
      setLoading(false)
    }
  }, [retroId, user])

  
  const fetchItemsAndState = useCallback(async () => {
    try {
      const itemsData = await apiService.getItems(retroId);
      setItems(itemsData);
  
      if (socket && isConnected && user) {
        // Emit request untuk semua data awal
        socket.emit('request-retro-state', { retroId });
  
        const handleRetroState = (state: {
          itemPositions?: { [key: string]: { x: number; y: number } },
          itemGroups?: any,
          signatureColors?: any
        }) => {
          const fromBackend = state.itemPositions || {};
  
          // Buat posisi berdasarkan urutan itemsData
          const mergedPositions: { [key: string]: { x: number; y: number } } = {};
          itemsData.forEach((item, index) => {
            mergedPositions[item.id] = fromBackend[item.id] || {
              x: 200 + (index % 3) * 220,
              y: 100 + Math.floor(index / 3) * 70
            };
          });
  
          // Set posisi yang sudah tersinkron dengan urutan itemsData
          setItemPositions(mergedPositions);
  
          if (state.itemGroups) {
            setItemGroups(state.itemGroups);
          }
  
          if (state.signatureColors) {
            setSignatureColors(state.signatureColors);
          }
  
          // Broadcast posisi jika backend belum kirim
          if (Object.keys(fromBackend).length === 0) {
            socket.emit('item-position-update', {
              retroId,
              itemPositions: mergedPositions,
              userId: user.id
            });
          }
        };
  
        socket.on(`retro-state:${retroId}`, handleRetroState);
  
        return () => {
          socket.off(`retro-state:${retroId}`, handleRetroState);
        };
      } else {
        // Fallback: jika socket belum ready, set default posisi
        const fallbackPositions: { [key: string]: { x: number; y: number } } = {};
        itemsData.forEach((item, index) => {
          fallbackPositions[item.id] = {
            x: 200 + (index % 3) * 220,
            y: 100 + Math.floor(index / 3) * 70
          };
        });
        setItemPositions(fallbackPositions);
      }
    } catch (error) {
      console.error("Error fetching items and state:", error);
    }
  }, [retroId, socket, isConnected, user]);
  


  
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
      await apiService.deleteItem(retroId, itemId, user.id)
      
      // Remove item from state
      setItems(prev => prev.filter(item => item.id !== itemId))
    } catch (error) {
      console.error("Error deleting item:", error)
      setError("Failed to delete item. Please try again.")
    } finally {
      setIsDeletingItem(false)
    }
  }, [retroId, user])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAddingItem) {
      handleAdd();
    }
  }, [handleAdd, isAddingItem]);

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

  const handleLogout = useCallback(async () => {
    try {
      await api.removeAuthToken(); // Panggil backend untuk logout
    } catch (error) {
      console.error('Failed to logout:', error);
    }
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    // If the ID is "new", redirect to the new retro page
    if (retroId === "new") {
      navigate("/retro/new")
      return
    }

    fetchRetroData()
    fetchItemsAndState()
  }, [retroId, navigate, fetchRetroData, fetchItemsAndState])

  const isCurrentFacilitator = participants.find(x => x.role)?.user.id === user?.id;
  const currentUserParticipant = participants.find(x => x.user.id === user?.id);
  
  const handleAddActionItemWebSocket = () => {

    if (!actionInput.trim() || !actionAssignee || !user?.id) {
      return;
    }

    // Cari nama assignee
    const assignee = participants.find((p: any) => p.user.id === actionAssignee);
    const assigneeName = assignee?.user.name || 'Unknown';
    // Kirim ke WebSocket
    if (socket && isConnected) {
      socket.emit('action-item-added', {
        retroId: retro?.id,
        task: actionInput,
        assigneeId: actionAssignee,
        assigneeName,
        createdBy: user.id
      });
    } else {
      console.log('❌ Socket not available or not connected');
    }

    // Kosongkan input task saja, jangan kosongkan assignee
    setActionInput('');
    // setActionAssignee(''); // Hapus baris ini agar assignee tidak berubah
  };
  
  

  

  // Request state dari server saat socket connect
  // useEffect(() => {
  //   if (socket && isConnected && retroId) {
  //     // Request state terkini dari server
  //     socket.emit('request-retro-state', { retroId });

  //     // Handler untuk menerima state dari server
  //     const handleRetroState = (state: { itemPositions: any, itemGroups: any, signatureColors: any }) => {
  //       // Only update itemPositions if we don't have any or if backend has more data
  //       if (state.itemPositions && Object.keys(state.itemPositions).length > 0) {
  //         setItemPositions(prev => {
  //           const currentKeys = Object.keys(prev);
  //           const backendKeys = Object.keys(state.itemPositions);
            
  //           // If backend has more positions or different positions, use backend data
  //           if (backendKeys.length > currentKeys.length || 
  //               !backendKeys.every(key => prev[key] && 
  //                 prev[key].x === state.itemPositions[key].x && 
  //                 prev[key].y === state.itemPositions[key].y)) {
  //             return { ...prev, ...state.itemPositions };
  //           }
  //           return prev;
  //         });
  //       }
        
  //       // Update other states
  //       if (state.itemGroups) {
  //         setItemGroups(state.itemGroups);
  //       }
  //       if (state.signatureColors) {
  //         setSignatureColors(state.signatureColors);
  //       }
  //     };
  //     socket.on(`retro-state:${retroId}`, handleRetroState);

  //     return () => {
  //       socket.off(`retro-state:${retroId}`, handleRetroState);
  //     };
  //   }
  // }, [socket, isConnected, retroId]);

  // 2. Listen for typing events from socket
  useEffect(() => {
    if (!socket) return;
    const handleTyping = (data: { userId: string }) => {
      setTypingParticipants((prev) => {
        if (prev.includes(data.userId)) return prev;
        return [...prev, data.userId];
      });
      // Jika ada timeout sebelumnya, clear
      if (typingTimeouts.current[data.userId]) {
        clearTimeout(typingTimeouts.current[data.userId]);
      }
      // Set timeout baru untuk menghapus user dari typingParticipants
      typingTimeouts.current[data.userId] = setTimeout(() => {
        setTypingParticipants((prev) => prev.filter((id) => id !== data.userId));
        delete typingTimeouts.current[data.userId];
      }, 1000); // 1 detik, sesuaikan dengan animasi dot
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
  useEffect(() => {
    if (socket && retroId && user) {
      socket.emit('request-voting-result', {
        retroId,
        userId: user.id
      });
  
      socket.on(`initial-voting-result:${retroId}`, (data: { allUserVotes: { [userId: string]: { [groupIdx: number]: number } } }) => {
        setAllUserVotes(data.allUserVotes); // update local state
      });
  
      return () => {
        socket.off(`initial-voting-result:${retroId}`);
      };
    }
  }, [socket, retroId, user, userVotes]);
  const [actionItems, setActionItems] = useState<Array<{
    id?: string;
    assignee?: string;
    assigneeId?: string;
    assigneeName: string;
    task: string;
    edited?: boolean;
    createdBy?: string;
    createdAt?: string;
  }>>([]);
  const [actionInput, setActionInput] = useState('');
  const [actionAssignee, setActionAssignee] = useState(participants[0]?.user.id || '');
  const [editingActionIdx, setEditingActionIdx] = useState<number | null>(null);
  const [editActionInput, setEditActionInput] = useState('');
  const [editActionAssignee, setEditActionAssignee] = useState('');
  useEffect(() => {
    // Hanya set actionAssignee jika belum ada nilai dan ada participants
    if (participants.length > 0 && !actionAssignee) {
      setActionAssignee(participants[0].user.id);
    }
  }, [participants, setActionAssignee]); // Hapus actionAssignee dari dependencies untuk mencegah infinite loop

  const handleEditActionItem = (idx: number) => {
    const item = actionItems[idx];
    setEditingActionIdx(idx);
    setEditActionInput(item.task);
    // Handle both old format (assignee) and new format (assigneeId)
    setEditActionAssignee(item.assigneeId || item.assignee || '');
  };

  const handleSaveEditActionItem = (idx: number) => {
    if (!editActionInput.trim() || !editActionAssignee || !user?.id) return;
    
    const item = actionItems[idx];
    const assignee = participants.find(p => p.user.id === editActionAssignee);
    const assigneeName = assignee?.user.name || 'Unknown';
    
    
    
    // Send to WebSocket
    if (socket && isConnected) {
      socket.emit('action-item-updated', {
        retroId,
        actionItemId: item.id || `temp_${idx}`,
        task: editActionInput,
        assigneeId: editActionAssignee,
        assigneeName,
        updatedBy: user.id
      });
    }
    
    // Clear editing state
    setEditingActionIdx(null);
    setEditActionInput('');
    setEditActionAssignee('');
  };

  const handleDeleteActionItem = (idx: number) => {
    const item = actionItems[idx];
    
    
    
    // Send to WebSocket
    if (socket && isConnected) {
      socket.emit('action-item-deleted', {
        retroId,
        actionItemId: item.id || `temp_${idx}`
      });
    }
  };

  // Phase switching
  if (phase === 'lobby') return (
    <RetroLobbyPage
      socket={socket}
      isConnected={isConnected}
      userId={userId || ''}
      retroId={retroId}
      participants={participants}
      setParticipants={setParticipants}
      retro={retro}
    />
  );
  if (phase === 'prime-directive') return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <PrimeDirectivePhase
        retro={retro}
        participants={participants}
        user={user}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
        isCurrentFacilitator={isCurrentFacilitator}
        currentUserParticipant={currentUserParticipant}
        typingParticipants={typingParticipants}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        broadcastPhaseChange={broadcastPhaseChange}
        setPhase={setPhase}
      />
    </>
  );
  if (phase === 'ideation') return (
    <>
      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <IdeationPhase
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
        setHighContrast={setHighContrast}
        itemGroups={itemGroups}
        setItemGroups={setItemGroups}
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
        getCategoryDisplayName={getCategoryDisplayName}
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
        setLabellingItems={setLabellingItems}
        isCurrentFacilitator={isCurrentFacilitator}
        typingParticipants={typingParticipants}
        setShowRoleModal={setShowRoleModal}
        setSelectedParticipant={setSelectedParticipant}
        setPhase={setPhase}
        broadcastPhaseChange={broadcastPhaseChange}
        groupLabels={groupLabels}
        setGroupLabels={setGroupLabels}
        socket={socket}
        isConnected={isConnected}
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
        allUserVotes={allUserVotes}
        currentUserRole={currentUserRole}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        handleLogout={handleLogout}
        labellingItems={labellingItems}
        setLabellingItems={setLabellingItems}
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
        socket={socket}
        isConnected={isConnected}
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
        labellingItems={labellingItems}
        setLabellingItems={setLabellingItems}
        groupLabels={groupLabels}
        userVotes={userVotes}
        actionItems={actionItems}
        actionInput={actionInput}
        actionAssignee={actionAssignee}
        setActionInput={setActionInput}
        setActionAssignee={setActionAssignee}
        handleAddActionItemWebSocket={handleAddActionItemWebSocket}
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
        socket={socket}
        isConnected={isConnected}
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
        labellingItems={labellingItems}
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
          {!isUserJoined && user && (
            <p className="text-sm text-indigo-600 mt-2">Joining as participant...</p>
          )}
        </div>
      </div>
    </>
  );
}

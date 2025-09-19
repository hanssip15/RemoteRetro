import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionItemsDisplayProps {
  actionItems: any[];
  isMobile?: boolean;
  isEditable?: boolean;
  isCurrentFacilitator?: boolean;
  user?: any;
  editingActionIdx?: number | null;
  editActionInput?: string;
  editActionAssignee?: string;
  allParticipants?: any[];
  onEdit?: (idx: number) => void;
  onSaveEdit?: (idx: number) => void;
  onCancelEdit?: () => void;
  onDelete?: (idx: number) => void;
  onSetEditInput?: (value: string) => void;
  onSetEditAssignee?: (value: string) => void;
  className?: string;
}

export default function ActionItemsDisplay({
  actionItems,
  isMobile = false,
  isEditable = false,
  isCurrentFacilitator = false,
  user,
  editingActionIdx,
  editActionInput,
  editActionAssignee,
  allParticipants = [],
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onSetEditInput,
  onSetEditAssignee,
  className = ""
}: ActionItemsDisplayProps) {
  if (actionItems.length === 0) {
    return (
      <span className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-xs md:text-sm'} ${className}`}>
        No action items yet.
      </span>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {actionItems.map((item: any, idx: number) => (
        <div 
          key={item.id || idx} 
          className={`bg-gray-50 border rounded px-3 py-2 ${
            isMobile ? 'text-sm' : 'text-xs md:text-sm'
          } flex items-start justify-between gap-2`}
        >
          {editingActionIdx === idx && isEditable ? (
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex gap-2">
                <select
                  className="w-32 px-2 py-1 rounded-md border text-sm"
                  value={editActionAssignee}
                  onChange={e => onSetEditAssignee?.(e.target.value)}
                >
                  {allParticipants.map((p: any) => (
                    <option key={p.user.id} value={p.user.id}>{p.user.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="border rounded px-2 py-1 flex-1 text-sm"
                  value={editActionInput}
                  onChange={e => onSetEditInput?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const originalTask = (item.task || '').trim()
                      const newTask = editActionInput?.trim() || ''
                      const originalAssignee = item.assigneeId || item.assignee || ''
                      const hasChanges = (newTask !== originalTask) || (editActionAssignee !== originalAssignee)
                      if (hasChanges) {
                        onSaveEdit?.(idx)
                      } else {
                        e.preventDefault()
                      }
                    }
                    if (e.key === "Escape") onCancelEdit?.()
                  }}
                />
              </div>
              <div className="flex gap-2 mt-1">
                <Button 
                  size="sm" 
                  className="bg-black text-white hover:bg-black/90" 
                  onClick={() => onSaveEdit?.(idx)} 
                  disabled={
                    editActionInput?.trim() === (item.task || '').trim() &&
                    (editActionAssignee === (item.assigneeId || item.assignee || ''))
                  }
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white text-gray-900 hover:bg-gray-100" 
                  onClick={() => onCancelEdit?.()}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 flex flex-col min-w-0">
                <span className="break-words">
                  {item.action_item} <span className="text-gray-700">({item.assign_to})</span>
                  {item.is_edited && <span className="ml-2 text-xs text-gray-500 font-semibold">(edited)</span>}
                </span>
              </div>
              {isEditable && (isCurrentFacilitator || item.createdBy == user?.id) && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Edit"
                    onClick={() => onEdit?.(idx)}
                    type="button"
                  >
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    className="p-1 hover:bg-red-100 rounded"
                    title="Delete"
                    onClick={() => {
                      if (window.confirm(`Yakin ingin menghapus action item: \"${item.action_item}\"?`)) {
                        onDelete?.(idx);
                      }
                    }}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

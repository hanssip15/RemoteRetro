import { getCategoryEmoji } from '@/lib/utils';

interface LabellingItemsDisplayProps {
  labellingItems: any[];
  retro: any;
  isMobile?: boolean;
  showVotes?: boolean;
  className?: string;
}

export default function LabellingItemsDisplay({
  labellingItems,
  retro,
  isMobile = false,
  showVotes = true,
  className = ""
}: LabellingItemsDisplayProps) {
  if (!labellingItems || labellingItems.length === 0) {
    return (
      <div className={`text-gray-400 text-sm text-center py-4 ${className}`}>
        <p>No labelling items available</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-row flex-wrap gap-4 md:gap-8 w-full justify-center ${className}`}>
      {labellingItems
        .sort((a: any, b: any) => b.votes - a.votes)
        .map((group: any) => (
          <div key={group.id} className={`bg-white border rounded-lg shadow-sm w-full sm:max-w-[400px] ${
            isMobile ? 'p-3' : 'p-2 md:p-4'
          }`}>
            <div className="mb-2 flex items-center justify-between">
              <span className={`font-semibold text-gray-400 ${
                isMobile ? 'text-sm' : 'text-lg'
              }`}>
                {group.label || 'Unlabeled'}
              </span>
              {showVotes && (
                <div className={`bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded text-center ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  Votes {group.votes || 0}
                </div>
              )}
            </div>
            <div className={`flex flex-col ${isMobile ? 'gap-1' : 'gap-1 md:gap-2'}`}>
              {group.group_items.map((item: any, idx: number) => (
                <div key={idx} className={`bg-gray-50 border rounded px-2 py-1 ${
                  isMobile ? 'text-xs' : 'text-xs md:text-sm'
                }`}>
                  <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-1 md:gap-3'}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${
                      isMobile ? 'text-xs' : 'text-xs md:text-sm'
                    }`}>
                      {getCategoryEmoji(item.item.format_type, retro.format)}
                    </span>
                    <span className="break-words flex-1">{item.item.content}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

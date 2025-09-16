import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PhaseLayoutProps {
  isCollapsed: boolean;
  onToggle: () => void;
  leftTitle: string;
  rightTitle: string;
  leftIcon: string;
  rightIcon: string;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftMaxHeight?: string;
  rightMaxHeight?: string;
  className?: string;
}

export default function PhaseLayout({
  isCollapsed,
  onToggle,
  leftTitle,
  rightTitle,
  leftIcon,
  rightIcon,
  leftContent,
  rightContent,
  leftMaxHeight = "calc(85vh-280px)",
  rightMaxHeight = "calc(85vh-280px)",
  className = ""
}: PhaseLayoutProps) {
  return (
    <div className={`flex w-full flex-1 overflow-hidden min-h-0 bg-white transition-all duration-300 ${
      isCollapsed ? 'flex-col md:grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]' : 'flex-row md:grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]'
    } ${className}`}>
      {/* Panel kiri - Mobile: Main Content, Desktop: Left Content */}
      <div className={`flex flex-col bg-white overflow-hidden min-h-0 ${
        isCollapsed ? 'w-full md:w-auto' : 'w-1/2 md:w-auto'
      }`}>
        {/* Mobile: Main Content */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2 p-4 border-b">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xl">{leftIcon}</span>
              <span className="text-lg font-semibold truncate">{leftTitle}</span>
            </div>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title={isCollapsed ? `Show ${rightTitle.toLowerCase()} sidebar` : `Hide ${rightTitle.toLowerCase()} sidebar`}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: leftMaxHeight }}>
            <div className="p-4">
              {leftContent}
            </div>
          </div>
        </div>

        {/* Desktop: Left Content */}
        <div className="hidden md:block">
          {leftContent}
        </div>
      </div>

      {/* Panel kanan - Mobile: Sidebar, Desktop: Right Content */}
      {(!isCollapsed || window.innerWidth >= 768) && (
        <div className={`bg-white flex flex-col h-full overflow-hidden min-h-0 md:w-[300px] lg:w-[400px] transition-all duration-300 ${
          isCollapsed ? 'w-full' : 'w-1/2'
        }`}>
          {/* Mobile: Sidebar */}
          <div className="md:hidden">
            {!isCollapsed && (
              <>
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xl">{rightIcon}</span>
                    <span className="text-lg font-semibold truncate">{rightTitle}</span>
                  </div>
                  <div className="w-6 h-6 p-1"></div>
                </div>
                <div className="flex-1 overflow-y-auto" style={{ maxHeight: rightMaxHeight }}>
                  <div className="p-4">
                    {rightContent}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop: Right Content */}
          <div className="hidden md:block">
            {rightContent}
          </div>
        </div>
      )}
    </div>
  );
}

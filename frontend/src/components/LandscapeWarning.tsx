
interface LandscapeWarningProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

export default function LandscapeWarning({ isVisible, message, subMessage }: LandscapeWarningProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black'
      }}
    >
      <div className="text-center text-white px-8">
        <h2 className="text-2xl font-bold mb-4">Rotate your device!</h2>
        <p className="text-lg mb-8">
          {message || "You're in portrait mode; this stage requires landscape!"}
        </p>
        
        {/* Phone icon with rotation indicator */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Phone outline */}
            <div className="w-16 h-28 border-2 border-white rounded-lg relative">
              {/* Screen area */}
              <div className="absolute inset-1 border border-white rounded-sm">
                {/* Home button */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 border border-white rounded-full"></div>
              </div>
            </div>
            
            {/* Rotation arrow indicator */}
            <div className="absolute -top-2 -right-2 w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
              <svg 
                className="w-4 h-4 text-white transform rotate-45" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4l5 5m0-5l-5 5m15 0l-5 5m0-5l5 5" 
                />
              </svg>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-300">
          {subMessage || "Please rotate your device to landscape orientation to continue"}
        </p>
      </div>
    </div>
  );
}

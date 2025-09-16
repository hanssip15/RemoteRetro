import React from 'react';

interface PhaseModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  buttonText?: string;
}

export default function PhaseModal({ 
  isVisible, 
  onClose, 
  title, 
  children, 
  buttonText = "Got it!" 
}: PhaseModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-8">
        <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>
        <div className="mb-4">
          {children}
        </div>
        <div className="flex justify-center">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

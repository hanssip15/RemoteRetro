import React from 'react';

interface TestErrorComponentProps {
  shouldError?: boolean;
}

const TestErrorComponent: React.FC<TestErrorComponentProps> = ({ shouldError = false }) => {
  if (shouldError) {
    throw new Error('This is a test error for ErrorBoundary testing');
  }

  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">Test Error Component</h3>
      <p className="text-blue-700 mb-4">
        This component is used to test the ErrorBoundary. 
        Set shouldError to true to trigger an error.
      </p>
      <button 
        onClick={() => {
          throw new Error('Button clicked error test');
        }}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Trigger Error
      </button>
    </div>
  );
};

export default TestErrorComponent;

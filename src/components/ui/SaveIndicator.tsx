import React from 'react';

interface SaveIndicatorProps {
  isVisible: boolean;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute right-2 top-2 text-blue-600">
      <div className="flex items-center gap-1 text-xs">
        <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        Saving...
      </div>
    </div>
  );
};
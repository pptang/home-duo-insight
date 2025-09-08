import React from 'react';

interface ValidationMessageProps {
  message: string;
  type: 'error' | 'warning' | 'info';
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ message, type }) => {
  const styles = {
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  return (
    <div className={`text-xs px-2 py-1 rounded border ${styles[type]}`}>
      {message}
    </div>
  );
};
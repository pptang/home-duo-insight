import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useMetadataEditing } from '@/contexts/MetadataEditingContext';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useFieldValidation } from '@/hooks/useFieldValidation';
import { ValidationMessage } from './ValidationMessage';
import { SaveIndicator } from './SaveIndicator';

interface EditableFieldProps {
  label: string;
  value?: string | number;
  fieldName: string;
  propertyKey: 'property_a' | 'property_b';
  type?: 'text' | 'number' | 'textarea';
  placeholder?: string;
  suffix?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  fieldName,
  propertyKey,
  type = 'text',
  placeholder,
  suffix
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { updateField, state } = useMetadataEditing();
  
  const fieldKey = `${propertyKey}.${fieldName}`;
  const isSaving = state.savingFields.has(fieldKey);
  const error = state.validationErrors[fieldKey];
  
  // Auto-save hook
  useAutoSave(localValue, (val) => {
    if (val !== value?.toString()) {
      updateField(propertyKey, fieldName, type === 'number' ? Number(val) || null : val || null);
    }
  }, 1000);

  // Format validation
  const { validateField } = useFieldValidation();

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    
    // Validate field if not empty
    if (localValue.trim()) {
      const validation = validateField(localValue, fieldName, type);
      if (!validation.isValid) {
        // Handle validation error - the hook will manage this
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setLocalValue(value?.toString() || '');
      setIsEditing(false);
    }
  };

  const displayValue = localValue || placeholder || 'Click to add...';
  const isEmpty = !localValue;

  if (isEditing) {
    const InputComponent = type === 'textarea' ? 'textarea' : 'input';
    
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {suffix && <span className="text-gray-500">({suffix})</span>}
        </label>
        <div className="relative">
          <InputComponent
            ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
            type={type === 'number' ? 'number' : 'text'}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
            rows={type === 'textarea' ? 3 : undefined}
          />
          <SaveIndicator isVisible={isSaving} />
        </div>
        {error && <ValidationMessage message={error} type="error" />}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {suffix && <span className="text-gray-500">({suffix})</span>}
      </label>
      <div 
        onClick={handleEdit}
        className={`
          w-full px-3 py-2 border rounded-md cursor-pointer transition-colors
          hover:border-blue-300 hover:bg-blue-50
          ${isEmpty ? 'text-gray-400 border-gray-200' : 'text-gray-900 border-gray-300'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={type === 'textarea' ? 'whitespace-pre-wrap' : 'truncate'}>
            {displayValue}
          </span>
          {!isEmpty && (
            <Check className="text-green-600 h-4 w-4 ml-2 shrink-0" aria-hidden />
          )}
        </div>
      </div>
      {error && <ValidationMessage message={error} type="error" />}
    </div>
  );
};
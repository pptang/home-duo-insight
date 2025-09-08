import React from 'react';
import { EditableField } from '../ui/EditableField';

interface CommuteTimeEditorProps {
  value?: number;
  propertyKey: 'property_a' | 'property_b';
}

export const CommuteTimeEditor: React.FC<CommuteTimeEditorProps> = ({ value, propertyKey }) => {
  return (
    <EditableField
      label="🚇 Commute Time"
      value={value}
      fieldName="commute_minutes"
      propertyKey={propertyKey}
      type="number"
      placeholder="Enter commute time..."
      suffix="minutes"
    />
  );
};
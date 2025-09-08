import React from 'react';
import { EditableField } from '../ui/EditableField';

interface AreaEditorProps {
  value?: number;
  propertyKey: 'property_a' | 'property_b';
}

export const AreaEditor: React.FC<AreaEditorProps> = ({ value, propertyKey }) => {
  return (
    <EditableField
      label="📐 Private Area"
      value={value}
      fieldName="private_area_sqm"
      propertyKey={propertyKey}
      type="number"
      placeholder="Enter area..."
      suffix="㎡"
    />
  );
};
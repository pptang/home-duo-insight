import React from 'react';
import { EditableField } from '../ui/EditableField';

interface FloorPlanEditorProps {
  value?: string;
  propertyKey: 'property_a' | 'property_b';
}

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ value, propertyKey }) => {
  return (
    <EditableField
      label="🏠 Floor Plan"
      value={value}
      fieldName="floor_plan"
      propertyKey={propertyKey}
      type="text"
      placeholder="e.g., 1LDK, 2DK..."
    />
  );
};
import React from 'react';
import { EditableField } from '../ui/EditableField';

interface ConstructionDateEditorProps {
  year?: number;
  month?: number;
  propertyKey: 'property_a' | 'property_b';
}

export const ConstructionDateEditor: React.FC<ConstructionDateEditorProps> = ({ 
  year, 
  month, 
  propertyKey 
}) => {
  return (
    <div className="space-y-2">
      <EditableField
        label="🏗️ Construction Year"
        value={year}
        fieldName="construction_year"
        propertyKey={propertyKey}
        type="number"
        placeholder="e.g., 2020"
      />
      <EditableField
        label="📅 Construction Month"
        value={month}
        fieldName="construction_month"
        propertyKey={propertyKey}
        type="number"
        placeholder="e.g., 3 (March)"
        suffix="1-12"
      />
    </div>
  );
};
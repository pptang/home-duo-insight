import React from 'react';
import { EditableField } from '../ui/EditableField';

interface AddressEditorProps {
  value?: string;
  propertyKey: 'property_a' | 'property_b';
}

export const AddressEditor: React.FC<AddressEditorProps> = ({ value, propertyKey }) => {
  return (
    <EditableField
      label="📍 Address"
      value={value}
      fieldName="address"
      propertyKey={propertyKey}
      type="textarea"
      placeholder="Enter property address..."
    />
  );
};
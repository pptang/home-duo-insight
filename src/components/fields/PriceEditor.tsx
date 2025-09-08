import React from 'react';
import { EditableField } from '../ui/EditableField';

interface PriceEditorProps {
  value?: number;
  propertyKey: 'property_a' | 'property_b';
}

export const PriceEditor: React.FC<PriceEditorProps> = ({ value, propertyKey }) => {
  return (
    <EditableField
      label="💰 Price"
      value={value}
      fieldName="price_yen"
      propertyKey={propertyKey}
      type="number"
      placeholder="Enter price in yen..."
      suffix="JPY"
    />
  );
};
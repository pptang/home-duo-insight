import React from 'react';
import { useTranslation } from 'react-i18next';
import { EditableField } from '../ui/EditableField';

interface PriceEditorProps {
  value?: number;
  propertyKey: 'property_a' | 'property_b';
}

export const PriceEditor: React.FC<PriceEditorProps> = ({ value, propertyKey }) => {
  const { t } = useTranslation();
  
  return (
    <EditableField
      label={t('fields.price.label')}
      value={value}
      fieldName="price_yen"
      propertyKey={propertyKey}
      type="number"
      placeholder={t('fields.price.placeholder')}
      suffix={t('fields.price.suffix')}
    />
  );
};
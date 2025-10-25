import React from 'react';
import { useTranslation } from 'react-i18next';
import { EditableField } from '../ui/EditableField';

interface AreaEditorProps {
  value?: number;
  propertyKey: 'property_a' | 'property_b';
}

export const AreaEditor: React.FC<AreaEditorProps> = ({ value, propertyKey }) => {
  const { t } = useTranslation();
  
  return (
    <EditableField
      label={t('fields.area.label')}
      value={value}
      fieldName="private_area_sqm"
      propertyKey={propertyKey}
      type="number"
      placeholder={t('fields.area.placeholder')}
      suffix={t('fields.area.suffix')}
    />
  );
};
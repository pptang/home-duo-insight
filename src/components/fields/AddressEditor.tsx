import React from 'react';
import { useTranslation } from 'react-i18next';
import { EditableField } from '../ui/EditableField';

interface AddressEditorProps {
  value?: string;
  propertyKey: 'property_a' | 'property_b';
}

export const AddressEditor: React.FC<AddressEditorProps> = ({ value, propertyKey }) => {
  const { t } = useTranslation();
  
  return (
    <EditableField
      label={t('fields.address.label')}
      value={value}
      fieldName="address"
      propertyKey={propertyKey}
      type="textarea"
      placeholder={t('fields.address.placeholder')}
    />
  );
};
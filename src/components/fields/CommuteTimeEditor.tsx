import React from 'react';
import { useTranslation } from 'react-i18next';
import { EditableField } from '../ui/EditableField';

interface CommuteTimeEditorProps {
  value?: number;
  propertyKey: 'property_a' | 'property_b';
}

export const CommuteTimeEditor: React.FC<CommuteTimeEditorProps> = ({ value, propertyKey }) => {
  const { t } = useTranslation();
  
  return (
    <EditableField
      label={t('fields.commuteTime.label')}
      value={value}
      fieldName="commute_minutes"
      propertyKey={propertyKey}
      type="number"
      placeholder={t('fields.commuteTime.placeholder')}
      suffix={t('fields.commuteTime.suffix')}
    />
  );
};
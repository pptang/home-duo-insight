import React from 'react';
import { useTranslation } from 'react-i18next';
import { EditableField } from '../ui/EditableField';

interface FloorPlanEditorProps {
  value?: string;
  propertyKey: 'property_a' | 'property_b';
}

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ value, propertyKey }) => {
  const { t } = useTranslation();
  
  return (
    <EditableField
      label={t('fields.floorPlan.label')}
      value={value}
      fieldName="floor_plan"
      propertyKey={propertyKey}
      type="text"
      placeholder={t('fields.floorPlan.placeholder')}
    />
  );
};
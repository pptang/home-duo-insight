import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  return (
    <div className="space-y-2">
      <EditableField
        label={t('fields.constructionYear.label')}
        value={year}
        fieldName="construction_year"
        propertyKey={propertyKey}
        type="number"
        placeholder={t('fields.constructionYear.placeholder')}
      />
      <EditableField
        label={t('fields.constructionMonth.label')}
        value={month}
        fieldName="construction_month"
        propertyKey={propertyKey}
        type="number"
        placeholder={t('fields.constructionMonth.placeholder')}
        suffix={t('fields.constructionMonth.suffix')}
      />
    </div>
  );
};
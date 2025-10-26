import React from 'react';
import { PropertyMetadataEditor } from './PropertyMetadataEditor';
import { useMetadataEditing } from '@/contexts/MetadataEditingContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export const MetadataReviewStage: React.FC = () => {
  const { t } = useTranslation();
  const { state, hasUnsavedChanges, saveAllChanges, proceedToComparison } = useMetadataEditing();

  const handleContinue = async () => {
    if (hasUnsavedChanges) {
      await saveAllChanges();
    }
    await proceedToComparison();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t('metadataReview.title')}
        </h2>
        <p className="text-gray-600">
          {t('metadataReview.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Property A Editor */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🏠 {t('metadataReview.propertyA')}
              {state.unsavedChanges.property_a.size > 0 && (
                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {t('metadataReview.unsavedChanges', { count: state.unsavedChanges.property_a.size })}
                </span>
              )}
            </h3>
          </div>
          <PropertyMetadataEditor 
            property={state.editedProperties.property_a}
            propertyKey="property_a"
          />
        </Card>

        {/* Property B Editor */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🏡 {t('metadataReview.propertyB')}
              {state.unsavedChanges.property_b.size > 0 && (
                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {t('metadataReview.unsavedChanges', { count: state.unsavedChanges.property_b.size })}
                </span>
              )}
            </h3>
          </div>
          <PropertyMetadataEditor 
            property={state.editedProperties.property_b}
            propertyKey="property_b"
          />
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          {t('metadataReview.startOver')}
        </Button>
        <Button 
          onClick={handleContinue}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-2"
          disabled={state.savingFields.size > 0}
        >
          {state.savingFields.size > 0 ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t('metadataReview.saving')}
            </div>
          ) : (
            t('metadataReview.continue')
          )}
        </Button>
      </div>
    </div>
  );
};
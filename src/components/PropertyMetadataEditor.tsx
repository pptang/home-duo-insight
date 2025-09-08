import React from 'react';
import { PriceEditor } from './fields/PriceEditor';
import { AreaEditor } from './fields/AreaEditor';
import { ConstructionDateEditor } from './fields/ConstructionDateEditor';
import { FloorPlanEditor } from './fields/FloorPlanEditor';
import { CommuteTimeEditor } from './fields/CommuteTimeEditor';
import { AddressEditor } from './fields/AddressEditor';
import { EditableField } from './ui/EditableField';

interface PropertyData {
  id: string;
  property_name?: string;
  address?: string;
  price_yen?: number;
  floor_plan?: string;
  commute_minutes?: number;
  property_type?: string;
  private_area_sqm?: number;
  construction_year?: number;
  construction_month?: number;
  building_age_years?: number;
  image_urls: string[];
  notes?: string;
}

interface PropertyMetadataEditorProps {
  property: PropertyData;
  propertyKey: 'property_a' | 'property_b';
}

export const PropertyMetadataEditor: React.FC<PropertyMetadataEditorProps> = ({
  property,
  propertyKey
}) => {
  return (
    <div className="space-y-4">
      {/* Property Images */}
      {property.image_urls && property.image_urls.length > 0 && (
        <div className="mb-6">
          <img 
            src={property.image_urls[0]} 
            alt={property.property_name || 'Property'}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Property Name */}
      <EditableField
        label="Property Name"
        value={property.property_name}
        fieldName="property_name"
        propertyKey={propertyKey}
        type="text"
        placeholder="Enter property name..."
      />

      {/* Address */}
      <AddressEditor
        value={property.address}
        propertyKey={propertyKey}
      />

      {/* Price */}
      <PriceEditor
        value={property.price_yen}
        propertyKey={propertyKey}
      />

      {/* Floor Plan */}
      <FloorPlanEditor
        value={property.floor_plan}
        propertyKey={propertyKey}
      />

      {/* Private Area */}
      <AreaEditor
        value={property.private_area_sqm}
        propertyKey={propertyKey}
      />

      {/* Commute Time */}
      <CommuteTimeEditor
        value={property.commute_minutes}
        propertyKey={propertyKey}
      />

      {/* Construction Date */}
      <ConstructionDateEditor
        year={property.construction_year}
        month={property.construction_month}
        propertyKey={propertyKey}
      />

      {/* Property Type */}
      <EditableField
        label="Property Type"
        value={property.property_type}
        fieldName="property_type"
        propertyKey={propertyKey}
        type="text"
        placeholder="e.g., Apartment, House..."
      />

      {/* Notes */}
      <EditableField
        label="Notes"
        value={property.notes}
        fieldName="notes"
        propertyKey={propertyKey}
        type="textarea"
        placeholder="Additional notes..."
      />
    </div>
  );
};
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SimilarProperty {
  id: string;
  property_name: string | null;
  address: string | null;
  price_yen: number | null;
  private_area_sqm: number | null;
  image_urls: string[] | null;
}

interface SimilarPropertiesProps {
  propertyAId: string;
  propertyBId: string;
  propertyAAddress: string | null;
  propertyBAddress: string | null;
  propertyAPriceYen: number | null;
  propertyBPriceYen: number | null;
}

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  if (price >= 100000000) return `¥${(price / 100000000).toFixed(2)}億`;
  if (price >= 10000) return `¥${(price / 10000).toFixed(0)}万`;
  return `¥${price.toLocaleString()}`;
}

export const SimilarProperties = ({
  propertyAId,
  propertyBId,
  propertyAAddress,
  propertyBAddress,
  propertyAPriceYen,
  propertyBPriceYen,
}: SimilarPropertiesProps) => {
  const [properties, setProperties] = useState<SimilarProperty[]>([]);

  useEffect(() => {
    const locationHint = (propertyAAddress ?? propertyBAddress ?? '').substring(0, 3);
    if (!locationHint) return;

    const prices = [propertyAPriceYen, propertyBPriceYen].filter((p): p is number => p !== null);
    if (prices.length === 0) return;

    const midprice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = midprice * 0.8;
    const maxPrice = midprice * 1.2;

    const fetchSimilar = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, property_name, address, price_yen, private_area_sqm, image_urls')
        .ilike('address', `${locationHint}%`)
        .gte('price_yen', minPrice)
        .lte('price_yen', maxPrice)
        .not('id', 'in', `(${propertyAId},${propertyBId})`)
        .order('id')
        .limit(4);

      if (error) {
        // Gracefully ignore query errors (e.g. missing columns)
        return;
      }

      setProperties((data as SimilarProperty[]) ?? []);
    };

    fetchSimilar();
  }, [propertyAId, propertyBId, propertyAAddress, propertyBAddress, propertyAPriceYen, propertyBPriceYen]);

  // Hide section if fewer than 4 results
  if (properties.length < 4) return null;

  return (
    <section className="max-w-[1040px] mx-auto px-6 mt-12">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60 mb-3">
        類似物件
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {properties.map((property) => {
          const thumbnail = property.image_urls?.[0] ?? null;
          return (
            <Link
              key={property.id}
              to="/feed"
              className="border border-rule rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow no-underline text-ink"
            >
              {/* Image area */}
              <div className="aspect-video bg-paper-dark flex items-center justify-center overflow-hidden">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={property.property_name ?? '物件'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MapPin className="w-6 h-6 text-ink-30" />
                )}
              </div>

              {/* Card body */}
              <div className="p-3 space-y-0.5">
                <div className="font-display text-[15px] tracking-[-0.2px] truncate">
                  {property.property_name ?? '—'}
                </div>
                <div className="font-mono text-[12px] text-ink-60">
                  {formatPrice(property.price_yen)}
                </div>
                {property.private_area_sqm != null && (
                  <div className="text-[12px] text-ink-60">
                    {property.private_area_sqm.toFixed(1)}m²
                  </div>
                )}
                {property.address && (
                  <div className="text-[11px] text-ink-30 truncate">
                    {property.address}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

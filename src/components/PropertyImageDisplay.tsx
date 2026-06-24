import { ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildImageSrc, buildImageSrcSet } from "@/lib/image";
import { Button } from "@/components/ui/button";

interface PropertyImageDisplayProps {
  imageUrls: string[] | null;
  propertyName: string;
  imageExtractionStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  className?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
  comparisonId?: string;
  onRetryImageExtraction?: (comparisonId: string) => void;
}

export const PropertyImageDisplay = ({
  imageUrls,
  propertyName,
  imageExtractionStatus = 'completed',
  className,
  aspectRatio = 'video',
  comparisonId,
  onRetryImageExtraction
}: PropertyImageDisplayProps) => {
  const hasImages = imageUrls && imageUrls.length > 0;
  const isLoading = imageExtractionStatus === 'pending' || imageExtractionStatus === 'in_progress';
  const hasFailed = imageExtractionStatus === 'failed';


  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    auto: ''
  };

  const baseClasses = cn(
    "bg-gray-200 rounded-lg overflow-hidden",
    aspectClasses[aspectRatio],
    className
  );

  // Show loading state while images are being extracted
  if (isLoading) {
    return (
      <div className={baseClasses}>
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin mb-1" />
          {aspectRatio === 'video' && (
            <p className="text-xs text-gray-500">Loading images...</p>
          )}
        </div>
      </div>
    );
  }

  // Show error state if image extraction failed
  if (hasFailed) {
    return (
      <div className={baseClasses}>
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 border-2 border-red-200 border-dashed">
          <ImageIcon className="h-4 w-4 text-red-400 mb-1" />
          {aspectRatio === 'video' && (
            <>
              <p className="text-xs text-red-500 mb-2">Failed to load images</p>
              {comparisonId && onRetryImageExtraction && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onRetryImageExtraction(comparisonId)}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Show image if available.
  // Served through Vercel's image optimizer (/_vercel/image) in production for
  // responsive AVIF/WebP; in dev buildImageSrc/SrcSet pass the raw URL through.
  if (hasImages) {
    const rawSrc = imageUrls[0];
    return (
      <div className={baseClasses}>
        <img
          src={buildImageSrc(rawSrc) ?? rawSrc}
          srcSet={buildImageSrcSet(rawSrc)}
          // One photo per property; full-width on mobile, ~half-width in the
          // 2-column comparison grid (md breakpoint = 768px).
          sizes="(min-width: 768px) 50vw, 100vw"
          alt={propertyName}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            // Drop the optimized srcset so the browser doesn't re-resolve to a
            // broken /_vercel/image variant, then fall back to the placeholder.
            img.srcset = "";
            img.src = "/placeholder.svg";
          }}
        />
      </div>
    );
  }

  // Show default placeholder when no images and extraction is complete
  return (
    <div className={baseClasses}>
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <ImageIcon className="h-12 w-12 text-gray-400" />
      </div>
    </div>
  );
};
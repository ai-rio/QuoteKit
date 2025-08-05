'use client';

import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface BlogImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function BlogImage({ 
  src, 
  alt, 
  className = '', 
  fill = false, 
  width, 
  height, 
  priority = false 
}: BlogImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback image with brand colors
  const fallbackSrc = 'https://placehold.co/600x400/2A3D2F/FFFFFF?text=LawnQuote+Blog&font=source-sans-pro';

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (imageError) {
    return (
      <div className={`bg-stone-gray/20 flex items-center justify-center ${className}`}>
        <div className="text-center text-charcoal/50">
          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`bg-stone-gray/20 animate-pulse ${className}`} />
      )}
      <Image
        src={imageError ? fallbackSrc : src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
      />
    </>
  );
}

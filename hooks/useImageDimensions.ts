import { FurnitureImage } from '@/types/furniture';
import { Image } from 'react-native';
import { useState, useEffect } from 'react';

export function useImageDimensions(feedPhotos: FurnitureImage[]) {
  const [photoDimensions, setPhotoDimensions] = useState<Record<string, { width: number; height: number }>>({});

  // Load image dimensions for proper aspect ratio
  useEffect(() => {
    const loadDimensions = async () => {
      const dimensions: Record<string, { width: number; height: number }> = {};
      
      await Promise.all(
        feedPhotos.map(async (photo) => {
          try {
            // Use promise-based Image.getSize
            await new Promise<void>((resolve, reject) => {
              Image.getSize(
                photo.public_url,
                (width, height) => {
                  dimensions[photo.id] = { width, height };
                  resolve();
                },
                (error) => {
                  console.warn(`Failed to get dimensions for photo ${photo.id}:`, error);
                  // Fallback to default aspect ratio (4:3)
                  dimensions[photo.id] = { width: 4, height: 3 };
                  resolve();
                }
              );
            });
          } catch (error) {
            console.warn(`Failed to get dimensions for photo ${photo.id}:`, error);
            // Fallback to default aspect ratio (4:3)
            dimensions[photo.id] = { width: 4, height: 3 };
          }
        })
      );
      
      setPhotoDimensions(dimensions);
    };

    if (feedPhotos.length > 0) {
      loadDimensions();
    }
  }, [feedPhotos]);

  return photoDimensions;
}


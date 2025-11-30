import { useAuth } from '@/contexts/AuthContext';
import { analyzeFurniture, identifyFurnitureSimple } from '@/services/openai';
import { searchSimilarImages } from '@/services/similaritySearch';
import { testCompleteUpload } from '@/services/supabaseTest';
import { FurnitureImage } from '@/types/furniture';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Alert, Image } from 'react-native';

type CameraMode = 'scan' | 'post';

interface UseCameraActionsProps {
  onImageAnalyzed: (uri: string, analysis: any) => void;
  onFeedRefresh?: () => void;
  onNavigateToFeed?: () => void;
}

export function useCameraActions({ onImageAnalyzed, onFeedRefresh, onNavigateToFeed }: UseCameraActionsProps) {
  const { user } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('scan');
  const [postPreviewUri, setPostPreviewUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [furnitureAnalysis, setFurnitureAnalysis] = useState<any>(null);
  const [currentPhotoUri, setCurrentPhotoUri] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [similarPhotos, setSimilarPhotos] = useState<FurnitureImage[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [isValidatingFurniture, setIsValidatingFurniture] = useState(false);
  const [isFurnitureItem, setIsFurnitureItem] = useState<boolean | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | 'original'>('1:1');

  const handleImageSelected = async (uri: string) => {
    if (cameraMode === 'post') {
      // Post mode: show preview immediately, then validate in background
      setPostPreviewUri(uri);
      setIsFurnitureItem(null); // Reset validation state
      
      // Validate if it's a furniture item in the background
      setIsValidatingFurniture(true);
      try {
        const result = await identifyFurnitureSimple(uri);
        const isValid = !result.item.toLowerCase().includes('not a furniture item');
        setIsFurnitureItem(isValid);
        
        if (!isValid) {
          Alert.alert(
            'Not a Furniture Item',
            'This image doesn\'t appear to be a furniture item. Please select a different image.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Go back to camera (clear preview)
                  setPostPreviewUri(null);
                  setIsFurnitureItem(null);
                }
              }
            ]
          );
        }
      } catch (error: any) {
        console.error('Error validating furniture:', error);
        // On validation error, allow upload anyway (fail open)
        setIsFurnitureItem(true);
        Alert.alert(
          'Validation Error',
          'Could not validate image. You can still upload, but make sure it\'s a furniture item.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsValidatingFurniture(false);
      }
    } else {
      // Scan mode: show analysis and bottom sheet
      setPreviewUri(uri);
      setCurrentPhotoUri(uri);
      setShowPhotoSheet(true);
      
      // Analyze the furniture (start with simple mode only)
      setIsAnalyzing(true);
      try {
        // Start with simple identification only (saves cost)
        const simpleResult = await analyzeFurniture(uri, 'simple');
        setFurnitureAnalysis(simpleResult);
        onImageAnalyzed(uri, simpleResult);
        
        // Fetch similar photos for Inspo tab
        setLoadingSimilar(true);
        try {
          const similar = await searchSimilarImages(simpleResult, 20);
          setSimilarPhotos(similar);
        } catch (similarError) {
          console.error('Error fetching similar photos:', similarError);
          setSimilarPhotos([]);
        } finally {
          setLoadingSimilar(false);
        }
      } catch (error: any) {
        console.error('Analysis error:', error);
        const errorMessage = error?.message || 'Failed to analyze furniture';
        Alert.alert(
          'Analysis Error',
          errorMessage + '\n\nShowing photo anyway.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // @ts-ignore - takePictureAsync exists on CameraView
        const photo = await cameraRef.current.takePictureAsync();
        
        // Get image dimensions
        const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          Image.getSize(
            photo.uri,
            (width, height) => resolve({ width, height }),
            (error) => reject(error)
          );
        });
        
        // Calculate crop based on selected aspect ratio (only in post mode)
        const { width, height } = imageInfo;
        
        // If aspect ratio is 'original' or not in post mode, skip cropping
        if (aspectRatio === 'original' || cameraMode !== 'post') {
          await handleImageSelected(photo.uri);
          return;
        }
        
        // Calculate crop dimensions based on selected aspect ratio (vertical orientation)
        // For vertical, interpret the ratio as height:width (longer side is height)
        // So "4:3" means height:width = 4:3, where height is 4/3 times the width
        let cropWidth: number;
        let cropHeight: number;
        
        // Parse aspect ratio as height:width (vertical orientation)
        const [ratioHeight, ratioWidth] = aspectRatio.split(':').map(Number);
        const verticalRatio = ratioHeight / ratioWidth; // height:width ratio (height is longer)
        
        // Calculate crop that fits within image bounds
        // For vertical, we want height to be the longer side
        const imageRatio = height / width; // height:width ratio of the image
        
        if (imageRatio > verticalRatio) {
          // Image is taller than target, fit to width
          cropWidth = width;
          cropHeight = width * verticalRatio;
        } else {
          // Image is wider/shorter than target, fit to height
          cropHeight = height;
          cropWidth = height / verticalRatio;
        }
        
        // Center the crop
        const originX = (width - cropWidth) / 2;
        const originY = (height - cropHeight) / 2;
        
        // Crop to selected aspect ratio
        const croppedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX,
                originY,
                width: cropWidth,
                height: cropHeight,
              },
            },
          ],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        await handleImageSelected(croppedImage.uri);
      } catch (error) {
        console.error('Error taking/cropping picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Apply aspect ratio crop if in post mode and aspect ratio is not 'original'
        if (cameraMode === 'post' && aspectRatio !== 'original') {
          try {
            // Get image dimensions
            const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
              Image.getSize(
                imageUri,
                (width, height) => resolve({ width, height }),
                (error) => reject(error)
              );
            });
            
            // Calculate crop based on selected aspect ratio (vertical orientation)
            // For vertical, interpret the ratio as height:width (longer side is height)
            // So "4:3" means height:width = 4:3, where height is 4/3 times the width
            const { width, height } = imageInfo;
            const [ratioHeight, ratioWidth] = aspectRatio.split(':').map(Number);
            const verticalRatio = ratioHeight / ratioWidth; // height:width ratio (height is longer)
            
            let cropWidth: number;
            let cropHeight: number;
            
            // For vertical, we want height to be the longer side
            const imageRatio = height / width; // height:width ratio of the image
            
            if (imageRatio > verticalRatio) {
              // Image is taller than target, fit to width
              cropWidth = width;
              cropHeight = width * verticalRatio;
            } else {
              // Image is wider/shorter than target, fit to height
              cropHeight = height;
              cropWidth = height / verticalRatio;
            }
            
            // Center the crop
            const originX = (width - cropWidth) / 2;
            const originY = (height - cropHeight) / 2;
            
            // Crop to selected aspect ratio
            const croppedImage = await ImageManipulator.manipulateAsync(
              imageUri,
              [
                {
                  crop: {
                    originX,
                    originY,
                    width: cropWidth,
                    height: cropHeight,
                  },
                },
              ],
              { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            
            await handleImageSelected(croppedImage.uri);
          } catch (error) {
            console.error('Error cropping image from library:', error);
            // Fallback to original image if cropping fails
            await handleImageSelected(imageUri);
          }
        } else {
          await handleImageSelected(imageUri);
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const handlePostUpload = async () => {
    if (!postPreviewUri || !user?.id) {
      Alert.alert('Error', 'No photo to upload or user not signed in');
      return;
    }

    // Check if validation is still in progress
    if (isValidatingFurniture) {
      Alert.alert('Please wait', 'Validating image...');
      return;
    }

    // Check if image was validated as not a furniture item
    if (isFurnitureItem === false) {
      Alert.alert(
        'Invalid Image',
        'This image doesn\'t appear to be a furniture item. Please select a different image.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsUploading(true);
    try {
      const result = await testCompleteUpload(postPreviewUri, user.id);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Photo uploaded successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset post preview
                setPostPreviewUri(null);
                // Refresh feed to show new photo
                if (onFeedRefresh) {
                  onFeedRefresh();
                }
                // Go back to feed
                if (onNavigateToFeed) {
                  onNavigateToFeed();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload photo');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', error?.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestDetailedAnalysis = async () => {
    if (!currentPhotoUri) return;
    
    setIsAnalyzing(true);
    try {
      const detailedResult = await analyzeFurniture(currentPhotoUri, 'detailed');
      setFurnitureAnalysis(detailedResult);
      
      // Update similar photos with more detailed analysis
      setLoadingSimilar(true);
      try {
        const similar = await searchSimilarImages(detailedResult, 20);
        setSimilarPhotos(similar);
      } catch (similarError) {
        console.error('Error fetching similar photos:', similarError);
        // Keep existing similar photos on error
      } finally {
        setLoadingSimilar(false);
      }
    } catch (error: any) {
      console.error('Detailed analysis error:', error);
      const errorMessage = error?.message || 'Failed to get detailed analysis';
      Alert.alert('Analysis Error', errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearPreview = () => {
    setPreviewUri(null);
    setPostPreviewUri(null);
    setShowPhotoSheet(false);
    setFurnitureAnalysis(null);
    setCurrentPhotoUri(null);
    setSimilarPhotos([]);
    setIsFurnitureItem(null);
    setIsValidatingFurniture(false);
  };

  return {
    cameraRef,
    cameraMode,
    setCameraMode,
    postPreviewUri,
    setPostPreviewUri,
    isUploading,
    previewUri,
    setPreviewUri,
    showPhotoSheet,
    setShowPhotoSheet,
    isAnalyzing,
    furnitureAnalysis,
    currentPhotoUri,
    flashEnabled,
    setFlashEnabled,
    similarPhotos,
    loadingSimilar,
    isValidatingFurniture,
    isFurnitureItem,
    aspectRatio,
    setAspectRatio,
    takePicture,
    pickImageFromLibrary,
    handlePostUpload,
    handleRequestDetailedAnalysis,
    clearPreview,
  };
}


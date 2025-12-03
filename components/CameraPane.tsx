import { PhotoBottomSheet } from '@/components/PhotoBottomSheet';
import { PostUploadScreen } from '@/components/PostUploadScreen';
import { PreviewOverlay } from '@/components/PreviewOverlay';
import { ScanFrame } from '@/components/ScanFrame';
import { useAuth } from '@/contexts/AuthContext';
import { FurnitureImage } from '@/types/furniture';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraPaneProps {
  scale: Animated.Value;
  cameraRef: React.RefObject<CameraView | null>;
  flashEnabled: boolean;
  onFlashToggle: () => void;
  cameraMode: 'scan' | 'post';
  onCameraModeChange: (mode: 'scan' | 'post') => void;
  onTakePicture: () => void;
  onPickImageFromLibrary: () => void;
  previewUri: string | null;
  postPreviewUri: string | null;
  postPreviewImageUri: string | null;
  isUploading: boolean;
  onPostCancel: () => void;
  onPostUpload: () => void;
  showPhotoSheet: boolean;
  furnitureAnalysis: any;
  isAnalyzing: boolean;
  onRequestDetailedAnalysis: () => void;
  onClearPreview: () => void;
  similarPhotos: FurnitureImage[];
  loadingSimilar: boolean;
  isValidatingFurniture: boolean;
  isFurnitureItem: boolean | null;
  aspectRatio: '1:1' | '4:3' | 'original';
  onAspectRatioChange: (ratio: '1:1' | '4:3' | 'original') => void;
  onBackFromCamera: () => void;
  onGeneratePlan?: (selectedIssues: string[]) => void;
  isGeneratingPlan?: boolean;
  postDescription?: string;
  onPostDescriptionChange?: (description: string) => void;
}

export function CameraPane({
  scale,
  cameraRef,
  flashEnabled,
  onFlashToggle,
  cameraMode,
  onCameraModeChange,
  onTakePicture,
  onPickImageFromLibrary,
  previewUri,
  postPreviewUri,
  isUploading,
  onPostCancel,
  onPostUpload,
  showPhotoSheet,
  furnitureAnalysis,
  isAnalyzing,
  onRequestDetailedAnalysis,
  onClearPreview,
  similarPhotos,
  loadingSimilar,
  isValidatingFurniture,
  isFurnitureItem,
  aspectRatio,
  onAspectRatioChange,
  onBackFromCamera,
  onGeneratePlan,
  isGeneratingPlan,
  postDescription = '',
  onPostDescriptionChange,
}: CameraPaneProps) {
  const { user } = useAuth();

  return (
    <Animated.View style={[styles.pane, { transform: [{ scale }] }]}>
      <CameraView 
        style={styles.camera} 
        facing="back" 
        ref={cameraRef} 
        flash={flashEnabled ? 'on' : 'off'}
        enableTorch={flashEnabled}
      />
      
      {/* Post Upload Screen - Full overlay */}
      {postPreviewUri && cameraMode === 'post' && (
        <View style={styles.postUploadOverlay}>
          <PostUploadScreen
            imageUri={postPreviewUri}
            description={postDescription || ''}
            onDescriptionChange={onPostDescriptionChange || (() => {})}
            onCancel={onPostCancel}
            onUpload={onPostUpload}
            isUploading={isUploading}
            isValidatingFurniture={isValidatingFurniture}
            isFurnitureItem={isFurnitureItem}
          />
        </View>
      )}
      
      {/* Camera UI hidden while preview is visible */}
      {!previewUri && !postPreviewUri ? (
        <>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={onBackFromCamera}>
              <Svg width={14} height={26} viewBox="0 0 14 26" fill="none">
                <Path d="M12.125 1.125L1.125 12.625L12.125 24.125" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={onFlashToggle}>
              <Ionicons 
                name={flashEnabled ? 'flash' : 'flash-off'} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* AR-style scan corners overlay - only show in scan mode */}
          {cameraMode === 'scan' && <ScanFrame isAnalyzing={isAnalyzing} />}

          {/* Aspect ratio crop guide overlay - only show in post mode */}
          {cameraMode === 'post' && aspectRatio !== 'original' && (() => {
            // Calculate crop guide dimensions based on aspect ratio (vertical orientation)
            // For vertical, interpret the ratio as height:width (longer side is height)
            // So "4:3" means height:width = 4:3, where height is 4/3 times the width
            const [ratioHeight, ratioWidth] = aspectRatio.split(':').map(Number);
            const verticalRatio = ratioHeight / ratioWidth; // height:width ratio (height is longer)
            
            let guideWidth: number;
            let guideHeight: number;
            
            // For vertical orientation, fit to screen width and calculate height
            guideWidth = SCREEN_WIDTH * 0.9; // Use 90% of screen width
            guideHeight = guideWidth * verticalRatio; // Height is longer side
            
            // Ensure it doesn't exceed screen height
            if (guideHeight > SCREEN_HEIGHT * 0.8) {
              guideHeight = SCREEN_HEIGHT * 0.8;
              guideWidth = guideHeight / verticalRatio;
            }
            
            const corner = 28;
            const stroke = 3;
            const top = (SCREEN_HEIGHT - guideHeight) / 2;
            const left = (SCREEN_WIDTH - guideWidth) / 2;
            
            return (
              <View
                style={[
                  styles.cropGuideOverlay,
                  {
                    width: guideWidth,
                    height: guideHeight,
                    top,
                    left,
                  },
                ]}
              >
                {/* Top-Left */}
                <View style={[styles.cornerH, { width: corner, height: stroke, top: 0, left: 0 }]} />
                <View style={[styles.cornerV, { width: stroke, height: corner, top: 0, left: 0 }]} />
                {/* Top-Right */}
                <View style={[styles.cornerH, { width: corner, height: stroke, top: 0, right: 0 }]} />
                <View style={[styles.cornerV, { width: stroke, height: corner, top: 0, right: 0 }]} />
                {/* Bottom-Left */}
                <View style={[styles.cornerH, { width: corner, height: stroke, bottom: 0, left: 0 }]} />
                <View style={[styles.cornerV, { width: stroke, height: corner, bottom: 0, left: 0 }]} />
                {/* Bottom-Right */}
                <View style={[styles.cornerH, { width: corner, height: stroke, bottom: 0, right: 0 }]} />
                <View style={[styles.cornerV, { width: stroke, height: corner, bottom: 0, right: 0 }]} />
              </View>
            );
          })()}

          {/* Aspect ratio cycle button - only show in post mode */}
          {cameraMode === 'post' && (
            <View style={styles.aspectRatioCycleButtonContainer}>
              <TouchableOpacity
                style={styles.aspectRatioCycleButton}
                onPress={() => {
                  const ratios: ('1:1' | '4:3' | 'original')[] = ['1:1', '4:3', 'original'];
                  const currentIndex = ratios.indexOf(aspectRatio);
                  const nextIndex = (currentIndex + 1) % ratios.length;
                  onAspectRatioChange(ratios[nextIndex]);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.aspectRatioCycleText}>
                  {aspectRatio === 'original' ? 'Default' : aspectRatio}
                </Text>
              </TouchableOpacity>
            </View>
          )}


          {/* Capture button and mode menu container */}
          <View style={styles.cameraBottomContainer}>
            {/* Capture button */}
            <View style={styles.bottomControls}>
              <TouchableOpacity style={styles.captureButton} onPress={onTakePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>

            {/* Camera Mode Menu */}
            <View style={styles.cameraModeMenu}>
              {/* Image picker button - left side */}
              <TouchableOpacity 
                style={styles.imagePickerButton} 
                onPress={onPickImageFromLibrary}
              >
                <Ionicons name="images-outline" size={28} color="#FFF" />
              </TouchableOpacity>

              {/* Scan and Post buttons */}
              <TouchableOpacity
                style={[styles.cameraModeButton, cameraMode === 'scan' && styles.cameraModeButtonActive]}
                onPress={() => onCameraModeChange('scan')}
                activeOpacity={0.7}
              >
                <Text style={[styles.cameraModeText, cameraMode === 'scan' && styles.cameraModeTextActive]}>
                  Scan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cameraModeButton, cameraMode === 'post' && styles.cameraModeButtonActive]}
                onPress={() => onCameraModeChange('post')}
                activeOpacity={0.7}
              >
                <Text style={[styles.cameraModeText, cameraMode === 'post' && styles.cameraModeTextActive]}>
                  Post
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : null}

      {/* Photo Preview Overlay - only for scan mode */}
      {previewUri && cameraMode === 'scan' && (
        <PreviewOverlay
          uri={previewUri}
          onClose={onClearPreview}
          isAnalyzing={isAnalyzing || loadingSimilar}
        />
      )}

      {/* Photo Bottom Sheet - only for scan mode */}
      {showPhotoSheet && cameraMode === 'scan' && (
        <PhotoBottomSheet
          onClose={onClearPreview}
          samplePhotos={similarPhotos.map((p, index) => ({ 
            id: index + 1, 
            uri: p.public_url, 
            height: 300,
            username: p.username,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            user_id: p.user_id,
          }))}
          currentUserId={user?.id}
          furnitureAnalysis={furnitureAnalysis}
          isAnalyzing={isAnalyzing || loadingSimilar}
          onRequestDetailedAnalysis={onRequestDetailedAnalysis}
          onGeneratePlan={onGeneratePlan}
          isGeneratingPlan={isGeneratingPlan}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pane: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  cameraContainer: {
    width: '100%',
    height: '100%',
  },
  camera: { 
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  imagePickerButton: {
    position: 'absolute',
    left: 20,
    top: '55%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: -40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(4, 4, 4, 0.3)',
    zIndex: 2,
  },
  captureButtonInner: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: 'white' 
  },
  cameraModeMenu: {
    width: '100%',
    backgroundColor: '#000000',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 35,
    paddingVertical: 20,
    position: 'relative',
  },
  cameraModeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    gap: 6,
    minWidth: 100,
  },
  cameraModeButtonActive: {
    // No background, just bold text
  },
  cameraModeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#AAA',
  },
  cameraModeTextActive: {
    color: '#8AA64E',
    fontWeight: '700',
  },
  postUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    backgroundColor: '#000',
  },
  postPreviewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 100,
  },
  postPreviewImage: {
    flex: 1,
    width: '100%',
  },
  postPreviewBottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  postDescriptionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  postDescriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  postDescriptionCharCount: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  postPreviewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: 16,
  },
  postCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  postCancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postUploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    gap: 8,
  },
  postUploadButtonDisabled: {
    opacity: 0.6,
  },
  postUploadText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  validationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 50,
  },
  validationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  validationErrorText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  aspectRatioCycleButtonContainer: {
    position: 'absolute',
    bottom: 120, // Above the bottom nav tab
    right: 20,
    zIndex: 10,
  },
  aspectRatioCycleButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aspectRatioCycleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cropGuideOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    zIndex: 5,
  },
  cornerH: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  cornerV: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 2,
  },
});


import { PhotoBottomSheet } from '@/components/PhotoBottomSheet';
import { PreviewOverlay } from '@/components/PreviewOverlay';
import { ScanFrame } from '@/components/ScanFrame';
import { FurnitureImage } from '@/types/furniture';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import { ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  onBackFromCamera: () => void;
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
  onBackFromCamera,
}: CameraPaneProps) {
  return (
    <Animated.View style={[styles.pane, { transform: [{ scale }] }]}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} flash={flashEnabled ? 'on' : 'off'} />
      
      {/* Camera UI hidden while preview is visible */}
      {!previewUri && !postPreviewUri ? (
        <>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton} onPress={onBackFromCamera}>
              <Ionicons name="arrow-back" size={24} color="white" />
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
          {cameraMode === 'scan' && <ScanFrame />}

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
                <Ionicons name="images-outline" size={24} color="#FFF" />
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

      {/* Post Preview Screen */}
      {postPreviewUri && cameraMode === 'post' && (
        <View style={styles.postPreviewContainer}>
          <Image source={{ uri: postPreviewUri }} style={styles.postPreviewImage} resizeMode="contain" />
          
          {/* Analyzing Animation Overlay */}
          {isValidatingFurniture && (
            <View style={styles.validationOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.validationText}>Analyzing image...</Text>
            </View>
          )}
          
          <View style={styles.postPreviewControls}>
            <TouchableOpacity
              style={styles.postCancelButton}
              onPress={onPostCancel}
              disabled={isUploading}
            >
              <Ionicons name="close" size={24} color="#FFF" />
              <Text style={styles.postCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.postUploadButton, 
                (isUploading || isValidatingFurniture || isFurnitureItem === false) && styles.postUploadButtonDisabled
              ]}
              onPress={onPostUpload}
              disabled={isUploading || isValidatingFurniture || isFurnitureItem === false}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={styles.postUploadText}>Uploading...</Text>
                </>
              ) : isValidatingFurniture ? (
                <>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={[styles.postUploadText, { color: '#666' }]}>Analyzing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={24} color={isFurnitureItem === false ? "#666" : "#000"} />
                  <Text style={[styles.postUploadText, isFurnitureItem === false && { color: '#666' }]}>Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Photo Preview Overlay - only for scan mode */}
      {previewUri && cameraMode === 'scan' && (
        <PreviewOverlay
          uri={previewUri}
          onClose={onClearPreview}
        />
      )}

      {/* Photo Bottom Sheet - only for scan mode */}
      {showPhotoSheet && cameraMode === 'scan' && (
        <PhotoBottomSheet
          onClose={onClearPreview}
          samplePhotos={similarPhotos.map((p, index) => ({ id: index + 1, uri: p.public_url, height: 300 }))}
          furnitureAnalysis={furnitureAnalysis}
          isAnalyzing={isAnalyzing || loadingSimilar}
          onRequestDetailedAnalysis={onRequestDetailedAnalysis}
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
  camera: { 
    flex: 1 
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
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    paddingBottom: 25,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  cameraModeTextActive: {
    color: '#FFF',
    fontWeight: '700',
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
});


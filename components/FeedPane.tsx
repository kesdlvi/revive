import { NailIcon } from '@/components/NailIcon';
import { FurnitureImage } from '@/types/furniture';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface FeedPaneProps {
  scale: Animated.Value;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCameraPress: () => void;
  feedPhotos: FurnitureImage[];
  loadingFeed: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  columns: {
    left: (FurnitureImage & { height: number; aspectRatio: number })[];
    right: (FurnitureImage & { height: number; aspectRatio: number })[];
    columnWidth: number;
  };
  onPhotoPress: (photo: FurnitureImage) => void;
  savedPhotos: Set<string>;
  onSaveToggle: (photoId: string) => Promise<void>;
}

export function FeedPane({
  scale,
  searchQuery,
  onSearchChange,
  onCameraPress,
  feedPhotos,
  loadingFeed,
  refreshing,
  onRefresh,
  columns,
  onPhotoPress,
  savedPhotos,
  onSaveToggle,
}: FeedPaneProps) {
  const toggleSave = async (photoId: string, e: any) => {
    e.stopPropagation();
    await onSaveToggle(photoId);
  };

  return (
    <Animated.View style={[styles.pane, { transform: [{ scale }] }]}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reVive"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onCameraPress} style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFF"
            colors={['#FFF']}
          />
        }
      >
        {loadingFeed ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        ) : feedPhotos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>Start by taking a photo!</Text>
          </View>
        ) : (
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {columns.left.map(photo => (
                <TouchableOpacity 
                  key={photo.id} 
                  style={styles.photoCard}
                  onPress={() => onPhotoPress(photo)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: photo.public_url }} 
                    style={[styles.photo, { width: columns.columnWidth, height: photo.height }]} 
                    resizeMode="contain"
                    fadeDuration={150}
                  />
                  <TouchableOpacity 
                    style={styles.savedButton}
                    onPress={(e) => toggleSave(photo.id, e)}
                  >
                    <NailIcon size={24} color="white" filled={savedPhotos.has(photo.id)} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.column}>
              {columns.right.map(photo => (
                <TouchableOpacity 
                  key={photo.id} 
                  style={styles.photoCard}
                  onPress={() => onPhotoPress(photo)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: photo.public_url }} 
                    style={[styles.photo, { width: columns.columnWidth, height: photo.height }]} 
                    resizeMode="contain"
                    fadeDuration={150}
                  />
                  <TouchableOpacity 
                    style={styles.savedButton}
                    onPress={(e) => toggleSave(photo.id, e)}
                  >
                    <NailIcon size={24} color="white" filled={savedPhotos.has(photo.id)} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    padding: 0,
    height: '100%',
    textAlignVertical: 'center',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  cameraButton: {
    marginLeft: 8,
    padding: 4,
  },
  masonryContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 10, 
    paddingTop: 10,
    gap: 16,
  },
  column: { 
    flex: 1,
  },
  photoCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F0F0F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photo: { 
    borderRadius: 12,
    backgroundColor: '#0F0F0F',
  },
  savedButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});


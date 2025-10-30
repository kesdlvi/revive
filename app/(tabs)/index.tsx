import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const navigateToCamera = () => {
    router.replace('/swipe');
  };

  const navigateToFeed = () => {
    router.replace('/swipe');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome to Refurb
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Capture moments and discover inspiration
        </ThemedText>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToCamera}>
            <Ionicons name="camera" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Open Camera</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToFeed}>
            <Ionicons name="grid" size={24} color="#007AFF" />
            <ThemedText style={styles.secondaryButtonText}>Browse Feed</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.bottomHint}>
        <ThemedText style={styles.hintText}>
          Swipe right to camera • Swipe left to feed
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomHint: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});

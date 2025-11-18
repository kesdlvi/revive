import {
    testCompleteUpload,
    testFetchImages,
    testImageUpload,
    testSupabaseConnection,
} from '@/services/supabaseTest';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TestSupabaseScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [testImage, setTestImage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const addResult = (message: string) => {
    setResult((prev) => prev + '\n' + message);
    console.log(message);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setResult('Testing Supabase connection...\n');
    try {
      const success = await testSupabaseConnection();
      addResult(success ? '✅ Connection successful!' : '❌ Connection failed');
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setTestImage(result.assets[0].uri);
        addResult(`📷 Image selected: ${result.assets[0].uri}`);
      }
    } catch (error: any) {
      addResult(`❌ Error picking image: ${error.message}`);
    }
  };

  const handleTakePhoto = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setTestImage(result.assets[0].uri);
        addResult(`📷 Photo taken: ${result.assets[0].uri}`);
      }
    } catch (error: any) {
      addResult(`❌ Error taking photo: ${error.message}`);
    }
  };

  const handleTestUpload = async () => {
    if (!testImage) {
      Alert.alert('No image', 'Please select or take an image first');
      return;
    }

    setLoading(true);
    setResult('Testing image upload...\n');
    try {
      const result = await testImageUpload(testImage);
      if (result.success && result.publicUrl) {
        setUploadedUrl(result.publicUrl);
        addResult('✅ Upload successful!');
        addResult(`🔗 URL: ${result.publicUrl}`);
      } else {
        addResult(`❌ Upload failed: ${result.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestComplete = async () => {
    if (!testImage) {
      Alert.alert('No image', 'Please select or take an image first');
      return;
    }

    setLoading(true);
    setResult('Testing complete upload flow...\n');
    try {
      const result = await testCompleteUpload(testImage);
      if (result.success) {
        addResult('✅ Complete test successful!');
        addResult(`📊 Image ID: ${result.imageData?.id}`);
        if (result.imageData?.public_url) {
          setUploadedUrl(result.imageData.public_url);
        }
      } else {
        addResult(`❌ Test failed: ${result.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchImages = async () => {
    setLoading(true);
    setResult('Fetching images from database...\n');
    try {
      const result = await testFetchImages();
      if (result.success) {
        addResult(`✅ Fetched ${result.images?.length || 0} images`);
        result.images?.forEach((img, i) => {
          addResult(`${i + 1}. ${img.item} - ${img.public_url}`);
        });
      } else {
        addResult(`❌ Fetch failed: ${result.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Supabase Test Screen</Text>
        <Text style={styles.subtitle}>Test image uploads and database operations</Text>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Connection Test</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleTestConnection}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Connection</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Select Image</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={handlePickImage}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Pick Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonHalf]}
              onPress={handleTakePhoto}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
          {testImage && (
            <Image source={{ uri: testImage }} style={styles.previewImage} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Upload Tests</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleTestUpload}
            disabled={loading || !testImage}
          >
            <Text style={styles.buttonText}>Test Upload Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleTestComplete}
            disabled={loading || !testImage}
          >
            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
              Test Complete Flow
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Fetch Test</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleFetchImages}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Fetch Images</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results</Text>
          <View style={styles.resultContainer}>
            {loading && <ActivityIndicator size="small" color="#007AFF" />}
            <Text style={styles.resultText}>{result || 'No results yet...'}</Text>
          </View>
        </View>

        {/* Uploaded Image Preview */}
        {uploadedUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uploaded Image</Text>
            <Image source={{ uri: uploadedUrl }} style={styles.uploadedImage} />
            <Text style={styles.urlText} numberOfLines={2}>
              {uploadedUrl}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
    resizeMode: 'cover',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
    resizeMode: 'cover',
  },
  resultContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    minHeight: 100,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  urlText: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
    fontFamily: 'monospace',
  },
});


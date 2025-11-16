import * as FileSystem from 'expo-file-system/legacy';

/**
 * Converts an image URI to base64 string for API uploads
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return base64;
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error}`);
  }
}


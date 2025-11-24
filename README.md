# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up OpenAI API Key

   Create a `.env` file in the root directory:
   ```bash
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   Get your API key from: https://platform.openai.com/api-keys

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo


## Interaction Sequence:

After opening the app, click the "Browse Feed" button, then the camera button at the bottom of the screen. Point the camera at any furniture item such as a chair or desk. Press the white button to take a photo. The app should recognize the item and identify it. 

Clicking on the "Revive" tab will bring you to a page that can get a further analysis on the item. To do this, click on the "Run Detailed Analysis" button. It should return a description of the item, its style, material, color, condition, and possible ways to repair the item. 



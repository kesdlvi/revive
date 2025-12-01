# revive 

![Nail Logo](assets/images/App-Logo-sm.png)
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

4. Sign up or log into the app
You will need to verify your email address after signing up.


## Interaction Sequence 1:

After signing up or logging in, you will be navigated to the feed page. Click on the camera button on the button navigation bar. From there you will be in "scan" mode on the camera. Point the camera at any furniture item of your choosing, you can use the square corner outlines as a guide. Press the white button at the bottom to scan the item. The app will identify your item and return similar items in the pop up feed. 

Clicking on the "Revive" tab will bring you to a page that can get a further analysis on the item. To do this, click on the "Run Detailed Analysis" button. It will return a more detailed description of the item and possible issues, with the option to add any if it not identify them. 

Note: Right now you will need an OpenAI API key in order for the item identification and analysis to work. 

## Interaction Sequence 2:
Navigate to the camera by clicking on the icon in the navigation bar or search bar. Then click on the "Post" tab. Position the furniture item you want to post in the frame. You will have the option to select various aspect ratios for your photo. Click the white button to take a photo of your item. The app will then analyze the item to make sure it is a furniture item, if a non furniture item is detected you will be prompted to take another photo. After the analysis you will have the option to upload the photo. Once the photo is uploaded you can see it in the "Feed" page and by clicking on the photo you can see it on its own page. The item will also be in your "Created" tab in the profile page. You also have the option to save photos by clicking on the nail icon. These will appear in the "Saved" tab in the profile page. 




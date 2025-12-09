# revive 

![Nail Logo](assets/images/App-Logo-sm.png)

## Prerequisites

Make sure you have the latest version of Node.js installed. You can check your current version by running:

```bash
node --version
```

If you need to update Node.js, download the latest version from [nodejs.org](https://nodejs.org/).

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

After signing up or logging in, you will be navigated to the feed page. Click on the camera button on the button navigation bar. From there you will be in "scan" mode on the camera. Point the camera at any furniture item of your choosing, you can use the square corner outlines as a guide. Press the white button at the bottom to scan the item. The app will scan the item, and return any issues it sees with the item. You will have the option to select those issues or add any of your own. After selecing these issues you can generate a plan by clicking on the button below. 

A new page will appear showing a step by step plan for each issue. If you would like to save the plan, either as an image or in the app, you can click on the icon on the top right to do so. Plans saved in the app will appear in the "Saved" tab on the profile page. 

Similar items posted by other people will appear in the "Inspo" tab after scanning an item. 

Note: Right now you will need an OpenAI API key in order for the item identification and analysis to work. 

## Interaction Sequence 2:
Navigate to the camera by clicking on the icon in the navigation bar or search bar. Then click on the "Post" tab. Position the furniture item you want to post in the frame. You will have the option to select various aspect ratios for your photo. Click the white button to take a photo of your item. The app will then analyze the item to make sure it is a furniture item, if a non furniture item is detected you will be prompted to take another photo. After the analysis you will have the option to upload the photo. Once the photo is uploaded you can see it in the "Feed" page and by clicking on the photo you can see it on its own page. The item will also be in your "Created" tab in the profile page. You also have the option to save photos by clicking on the nail icon. These will appear in the "Saved" tab in the profile page. 

There is also an option to comment on posts. To do this, clikc on any post and swipe to the bottom which will show a text bar. You will have the option to select what kind of comment you have. 




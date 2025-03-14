import "dotenv/config";
import { Midjourney } from "../";
import connectDB from '../connectDB';
import { Prompt } from '../models/prompt';


// Function to send the prompt to Midjourney
async function sendToMidjourney(finalPrompt: string, promptId: string) {
  console.log("Inside sendToMidjourney")
  try {
    // Initialize Midjourney client with environment variables
    const client = new Midjourney({
      ServerId: <string>process.env.SERVER_ID,
      ChannelId: <string>process.env.CHANNEL_ID,
      SalaiToken: <string>process.env.SALAI_TOKEN,
      HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
      Debug: true,
      Ws: true, // required
    });

    // Connect to the Midjourney bot
    await client.Connect(); // required

    // Send the final prompt to Midjourney for image generation
    const Imagine = await client.Imagine(finalPrompt, (uri: string, progress: string) => {
      console.log("Imagine.loading", uri, "progress", progress);
    });

    // Log the result of the Imagine request
    console.log({ Imagine });

    // Check if the response is successful
    if (!Imagine) {
      console.log("Failed to generate image.");
      return;
    }
    if (Imagine) {
      //save to database here
      try {
        const extractedId = Imagine.uri.toString().match(/([a-f0-9-]{36})(?=\.png)/); // Match the image ID before `.png`
        var uniqueId = '';
        var urlArray =[];
        if(extractedId) {
          uniqueId = extractedId[0];
          for (let i = 0; i < 4; i++) {
            const imgUrl = `https://cdn.midjourney.com/${uniqueId}/0_${i}.png`;
            urlArray.push(imgUrl);
          }
        }
        
        const prompt = await Prompt.findById(promptId.toString());
        if (!prompt) {
          console.error('Prompt not found');
        return;
        }
        prompt.imageUrls = urlArray;
        // prompt.imageName = imageName;
        await prompt.save();
        console.log('Prompt updated successfully:', prompt);

        
      } catch (error) {
        console.error('Error saving image data:', error);
      }
    }

    // You can handle the generated image details here
    // Example: You might want to save the image URL or use it in your frontend
    console.log("Image URL: ", Imagine.uri);

    // Close the client connection after the request
    client.Close();
    
    return true;
  } catch (err) {
    console.error("Error sending prompt to Midjourney:", err);
  }
}

export default sendToMidjourney;
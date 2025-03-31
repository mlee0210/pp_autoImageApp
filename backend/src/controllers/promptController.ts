// src/controllers/promptController.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { MidjourneyData } from '../models/midjourneyData';
import RandomPrompt from '../models/randomPrompts';
import sendToMidjourney from './imagine-ws';
import { broadcastMessage } from "../utils/websocket"; // Import WebSocket function

const promptRoutes: Router = Router();

// Example random prompts, you can fetch these from your database or another source
export const getRandomPrompt = async () => {
  try {
    // Get the total count of documents in the collection
    const count = await RandomPrompt.countDocuments();

    if (count === 0) {
      console.log("No prompts in the database.");
      return null; // Return null if no prompts exist
    }

    // Generate a random index
    const randomIndex = Math.floor(Math.random() * count);

    // Fetch the random prompt
    const randomPrompt = await RandomPrompt.findOne().skip(randomIndex);

    if (!randomPrompt) {
      console.log("No prompt found.");
      return null;
    }

    console.log("Random prompt fetched:", randomPrompt.prompt);
    return randomPrompt.prompt; // Return the random prompt text
  } catch (error) {
    console.error("Error fetching random prompt:", error);
    return null;
  }
};

// Translate the random prompt into English using OpenAI
export const getGPTPrompt = async (prompt: string) => {
  console.log("Inside getGPTPrompt");
  try {
    // Use the chat/completions endpoint for GPT-4 (or GPT-3.5)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', // Updated endpoint
      {
        model: 'gpt-3.5-turbo', // Use GPT-4 model
        messages: [
          {
            role: "system",
            content: 
              "You are an expert in analyzing prompts. When given a prompt, break it down into the following structured components:\n\n" +
              "Meaning: Briefly explain the meaning of the scene using commas.\n" +
              "Main Metaphor: Describe the location, appearance, and essence of the main metaphor.\n" +
              "Sub Metaphor: Include 2-3 additional symbolic objects different from the main metaphor (more objects create complexity).\n" +
              "Lighting: Describe the lighting conditions (e.g., studio light, daylight, backlit, etc.).\n" +
              "Angle: Specify the camera angle (e.g., low angle, high angle, top view).\n" +
              "Background: Provide details on the background setting.\n" +
              "Main Color (Hex-code): Describe the main color, using either hex codes or descriptive words.\n" +
              "Tone & Mood: Briefly explain the emotional tone and mood.\n" +
              "Render: Specify a rendering style (e.g., octane render, redshift render, cinematic render).\n" +
              "Story: Expand on the content that may be missing.\n" +
              "Point: List representative style elements such as hyperrealism, surreal, cyberpunk, etc.\n" +
              "Style Reference: (Optional) Provide an image link for style guidance.\n\n" +
              "Your response should be formatted as structured bullet points. Do not include any extra text or explanations outside of the required sections."
          },
          { 
            role: 'user', 
            content: `Please analyze this prompt: ${prompt}` 
          }
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure the correct API key is provided
        },
      }
    );
    // Extract the translated prompt from the response
    const gptPrompt = response.data.choices[0].message.content.trim();

    return gptPrompt;
  } catch (error) {
    console.error('Error in getting GPT prompt:', error);
    throw new Error('Failed to get GPT prompt');
  }
};

// Fine-tune the translated prompt to Midjourney format using OpenAI
export const getMidjourneyPrompt = async (prompt: string) => {
  console.log("Inside getMidjourneyPrompt");
  try {
    // Use the chat/completions endpoint for GPT-4 (or GPT-3.5)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', // Updated endpoint
      {
        model: 'gpt-3.5-turbo', // Use GPT-4 model
        messages: [
          {
            role: "system",
            content: 
              "You are an expert in crafting Midjourney prompts. Given a structured scene breakdown, your task is to convert it into a concise, effective Midjourney prompt.\n\n" +
              "Guidelines:\n" +
              "- Keep it short and impactful.\n" +
              "- Avoid long lists or excessive details.\n" +
              "- Use descriptive phrases instead of full sentences.\n" +
              "- You can utilize Midjourney’s parameters if necessary.\n\n" +
              "Format:\n" +
              "- Write a natural, flowing Midjourney-style prompt.\n" +
              "- Do not include section headers from the input."
          },
          { 
            role: 'user', 
            content: `Convert this into a Midjourney prompt: ${prompt}` 
          }
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure the correct API key is provided
        },
      }
    );
    // Extract the fine-tuned prompt from the response
    const finalPrompt = response.data.choices[0].message.content.trim();

    return finalPrompt;
  } catch (error) {
    console.error('Error in fine-tuning prompt:', error);
    throw new Error('Failed to fine-tune prompt');
  }
};

// Save the original and final prompts into the MongoDB database
export const savePromptToDB = async (originalPrompt: string, gptPrompt: string, midjourneyPrompt: string) => {
  try {
    const newPrompt = new MidjourneyData({
      originalPrompt: originalPrompt,
      gptPrompt: gptPrompt,
      midjourneyPrompt: midjourneyPrompt,
      imageUrl: '',  // We'll update this after getting the image URL from Midjourney
      imageName: '', // We'll update this after getting the image name from Midjourney
    });
    const savedPrompt = await newPrompt.save();  // Save the prompt in the database
    return savedPrompt._id;  // Return the prompt ID so we can later update it
  } catch (error) {
    console.error('Error saving prompt to DB:', error);
  }
};

let isProcessing = false;

// The main process that orchestrates fetching the prompt, translating, fine-tuning, and saving it
export const startProcess = async () => {
  console.log("Inside startProcess")
  // If already processing, do nothing
  if (isProcessing) {
    broadcastMessage("Process is already running");
  }
  isProcessing = true; // Set processing flag to true
  while (isProcessing) {
    try {
      console.log("Running process loop...");

      // Fetch a random prompt
      const randomPrompt = await getRandomPrompt();
      
      if (randomPrompt) {
        // Translate the random prompt
      const gptPrompt = await getGPTPrompt(randomPrompt);
      
      const midjourneyPrompts = [];

      // Generate 10 Midjourney prompts
      // Midjourney prompt 몇개 생성할지 지정
      for (let i = 0; i < 2; i++) {
        const midjourneyPrompt = await getMidjourneyPrompt(gptPrompt);
        if (midjourneyPrompt) {
          midjourneyPrompts.push(midjourneyPrompt);
        }
      }

      let answer = false;
      
      // Send each Midjourney prompt 10 times
      // Midjourney bot에게 몇번의 이미지 생성 요청할지 지정 
      for (const midjourneyPrompt of midjourneyPrompts) {
        for (let i = 0; i < 3; i++) {
          const promptId = await savePromptToDB(randomPrompt, gptPrompt, midjourneyPrompt); // Save each iteration separately
          await sendToMidjourney(midjourneyPrompt, promptId as string);
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30-second delay
        }
        answer = true;
      }

      if(answer) {
        // Respond with success
        broadcastMessage("Iteration Complete");
      }
      // Once the process is complete, broadcast a message to all WebSocket clients
      // broadcastMessage('Process completed successfully!');
      console.log("Process iteration completed.");
      }
      
    } catch (error) {
        broadcastMessage("Error occurred during process!"); // Ensure this function exists
    }
  }
};

// Stop Process Function
export const stopProcess = async (req: Request, res: Response) => {
  console.log("Stop process requested"); // Add this to log when the endpoint is hit

  if (!isProcessing) {
    res.status(400).json({ message: "No process is running" });
  }

  isProcessing = false;
  res.status(200).json({ message: "Process stopped" });
};


export const fetchData = async (req: Request, res: Response) => {
  console.log('inside fetchData');
  const page = parseInt(req.query.page as string) || 1; // Default to page 1
  const limit = parseInt(req.query.limit as string) || 10; // Default to 10 items per page
  try {
    const skips = (page - 1) * limit;
    const prompts = await MidjourneyData.find()
    .sort({ createdAt: -1 }) // Sort by createdAt (most recent first)
    .skip(skips)
    .limit(limit); // Fetch all stored prompts

    // Count the total number of documents
    const total = await MidjourneyData.countDocuments();

    res.json({
      prompts,
      total,
      pages: Math.ceil(total / limit), // Calculate total pages
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Define the routes for the backend
promptRoutes.get('/', fetchData);

promptRoutes.post('/start', startProcess);

promptRoutes.post('/stop', stopProcess);

promptRoutes.get('/allData', fetchData);



// Export the routes so they can be used in the main server
export { promptRoutes };

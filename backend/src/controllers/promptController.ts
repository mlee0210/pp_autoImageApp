// src/controllers/promptController.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { MidjourneyData } from '../models/midjourneyData';
import RandomPrompt from '../models/randomPrompts';
import express from 'express';
import sendToMidjourney from './imagine-ws';
import { broadcastMessage } from "../utils/websocket"; // Import WebSocket function
import { random } from '../utils';

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
export const translatePrompt = async (prompt: string) => {
  console.log("Inside translatePrompt");
  try {
    // Use the chat/completions endpoint for GPT-4 (or GPT-3.5)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', // Updated endpoint
      {
        model: 'gpt-4', // Use GPT-4 model
        messages: [
          { role: 'system', content: 'Improve this text in clear English.' },
          { role: 'user', content: `Translate this prompt into English: ${prompt}` }
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
    const translatedPrompt = response.data.choices[0].message.content.trim();

    return translatedPrompt;
  } catch (error) {
    console.error('Error in translating prompt:', error);
    throw new Error('Failed to translate prompt');
  }
};

// Fine-tune the translated prompt to Midjourney format using OpenAI
export const fineTunePrompt = async (prompt: string) => {
  console.log("Inside fineTunePrompt");
  try {
    // Use the chat/completions endpoint for GPT-4 (or GPT-3.5)
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions', // Updated endpoint
      {
        model: 'gpt-4', // Use GPT-4 model
        messages: [
          { role: 'system', content: 'Format this text for Midjourney prompt generation. Do not add a title, just provide the description' },
          { role: 'user', content: `Convert this into a Midjourney prompt: ${prompt}` }
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
    const tunedPrompt = response.data.choices[0].message.content.trim();

    return tunedPrompt;
  } catch (error) {
    console.error('Error in fine-tuning prompt:', error);
    throw new Error('Failed to fine-tune prompt');
  }
};

// Save the original and final prompts into the MongoDB database
export const savePromptToDB = async (originalPrompt: string, translatedPrompt: string, finalPrompt: string) => {
  try {
    const newPrompt = new MidjourneyData({
      originalPrompt: originalPrompt,
      translatedPrompt: translatedPrompt,
      finalPrompt: finalPrompt,
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
      const translatedPrompt = await translatePrompt(randomPrompt);
  
      // Fine-tune the translated prompt to Midjourney format
      const finalPrompt = await fineTunePrompt(translatedPrompt);
  
      // Save the prompts to the database
      const promptId = await savePromptToDB(randomPrompt, translatedPrompt, finalPrompt);
      
      //Send the final prompt to Midjourney 
      const answer = await sendToMidjourney(finalPrompt, promptId as string);
     
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
    console.log(page)
    console.log(limit)
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

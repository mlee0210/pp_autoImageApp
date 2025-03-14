// src/controllers/promptController.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { Prompt } from '../models/prompt';
import express from 'express';
import sendToMidjourney from './imagine-ws';
// import { broadcastMessage } from '../server';  // Import the broadcast function

const promptRoutes: Router = Router();

// Example random prompts, you can fetch these from your database or another source
export const getRandomPrompt = async () => {
  console.log("Inside getRandomPrompt");
  const arr = ["미래지향적인 도시", "검은 고양이", "빨간 머리 앤"];
  const randomIndex = Math.floor(Math.random() * arr.length);
  
  return arr[randomIndex];
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
    const newPrompt = new Prompt({
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

// The main process that orchestrates fetching the prompt, translating, fine-tuning, and saving it
export const startProcess = async (req: Request, res: Response) => {
  console.log("Inside startProcess")
  try {
    // Fetch a random prompt
    const randomPrompt = await getRandomPrompt();

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
      res.status(200).json({ message: 'Process started successfully!' });
    }
    // Once the process is complete, broadcast a message to all WebSocket clients
    // broadcastMessage('Process completed successfully!');
    
    
  } catch (error) {
    res.status(500).json({ message: "error"});
  }
};

export const fetchData = async (req: Request, res: Response) => {
  console.log('inside fetchData');
  try {
    const prompts = await Prompt.find(); // Fetch all stored prompts
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Define the routes for the backend
promptRoutes.get('/', fetchData);

promptRoutes.post('/start', startProcess);

promptRoutes.get('/allData', fetchData);



// Export the routes so they can be used in the main server
export { promptRoutes };

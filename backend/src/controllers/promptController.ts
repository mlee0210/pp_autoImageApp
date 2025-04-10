// src/controllers/promptController.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { MidjourneyData } from '../models/midjourneyData';
import RandomPrompt from '../models/randomPrompts';
import sendToMidjourney from './imagine-ws';
import { broadcastMessage } from "../utils/websocket"; // Import WebSocket function
import dayjs from 'dayjs';

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
    // const randomIndex = Math.floor(Math.random() * count);
    const randomIndex = 0;

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
        model: "gpt-4o", // Use GPT-4 model
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
        model: "gpt-4o", // Use GPT-4 model
        messages: [
          {
            role: "system",
            content: 
              "You are an expert in crafting Midjourney prompts. Given a structured scene breakdown, your task is to convert it into a concise, effective Midjourney prompt.\n\n" +
              "Guidelines:\n" +
              "- Keep it short and impactful.\n" +
              "- Avoid long lists or excessive details.\n" +
              "- Use descriptive phrases instead of full sentences.\n" +
              "- If there are Midjourney parameters, leave as is, and add it to the end of the prompt. Do not try to describe it in words. Leave it as it is.\n\n" +
              "Format:\n" +
              "- Write a natural, flowing Midjourney-style prompt.\n" +
              "- Do not include section headers from the input. Do not add any Midjourney parameters"
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
export const savePromptToDB = async (originalPrompt: string, gptPrompt: string, midjourneyPrompt: string, imageNumber: string) => {
  try {
    const newPrompt = new MidjourneyData({
      originalPrompt: originalPrompt,
      gptPrompt: gptPrompt,
      midjourneyPrompt: midjourneyPrompt,
      imageUrl: '',  // We'll update this after getting the image URL from Midjourney
      imageName: '', // We'll update this after getting the image name from Midjourney
      imageNumber: imageNumber,
    });
    const savedPrompt = await newPrompt.save();  // Save the prompt in the database
    return savedPrompt._id;  // Return the prompt ID so we can later update it
  } catch (error) {
    console.error('Error saving prompt to DB:', error);
  }
};

let isProcessing = false;

// The main process that orchestrates fetching the prompt, translating, fine-tuning, and saving it
export const startProcess = async (req?: Request, res?: Response) => {
  const userPrompt = req?.body?.prompt;
  const totalNumber = req?.body?.totalNumber;
  const gptNumber = req?.body?.chatGPTNumber;


  console.log("Inside startProcess")
  broadcastMessage("프로세스 시작");

  if (isProcessing) {
    broadcastMessage("Process is already running");
    return;
  }

  isProcessing = true; // Set processing flag to true

  try {
    console.log("Running process loop...");
    
    if (userPrompt && totalNumber && gptNumber) {
      const baseIteration = Math.floor(totalNumber / gptNumber);
      const remainder = totalNumber % gptNumber;

      const gptPrompts = [];
      const midjourneyPrompts = [];

      for (let i = 1; i <= baseIteration; i++) {
        const gptPrompt = await getGPTPrompt(userPrompt);
        let midjourneyPrompt = await getMidjourneyPrompt(gptPrompt);
        if (midjourneyPrompt) {
          midjourneyPrompt += "--ar 16:9 --v 6.1 --s 1000";
        }
        if(gptPrompt && midjourneyPrompt) {
          gptPrompts.push(gptPrompt);
          midjourneyPrompts.push(midjourneyPrompt);
        }
      }
      broadcastMessage("ChatGPT를 사용한 Midjourney 프롬프트 생성 완료");

      // 날짜 포맷: YYMMDD
      const todayPrefix = dayjs().format("YYMMDD");
      
      // 1️⃣ 오늘 날짜의 마지막 gptIndex 조회
      const latestNumber = await getLatestNumberForToday(todayPrefix); 
      let gptIndexOffset = latestNumber; // 새로 시작할 gptIndex

      for (let i = 1; i <= gptPrompts.length; i++) {
        const gptPrompt = gptPrompts[i - 1];
        const midjourneyPrompt = midjourneyPrompts[i - 1];
        const currentIndex = gptIndexOffset + i;

        // 마지막 gptPrompt에 나머지를 추가로 할당
        const currentIterations = i === gptPrompts.length ? gptNumber + remainder : gptNumber;

        for (let j = 1; j <= currentIterations; j++) {
          const imageNumber = `${todayPrefix}_${currentIndex}_${j}`;
          const promptId = await savePromptToDB(userPrompt, gptPrompt, midjourneyPrompt, imageNumber);
          broadcastMessage(`현재: ${i}번째 ChatGPT 프롬프트의 ${j}번째 이미지 생성 중`);
          await sendToMidjourney(midjourneyPrompt, promptId as string);
          await new Promise(resolve => setTimeout(resolve, 20000)); // 20초 대기

          if (!isProcessing) {
            console.log("Stop requested. Breaking after current iteration.");
            broadcastMessage("프로세스 중단 요청. 현재 iteration 완료 후 종료 예정");
            break;
          }
        }
        if(!isProcessing) break;
      }
      broadcastMessage("프로세스 완료");
      console.log("Process iteration completed.");
      isProcessing = false;
    }
  } catch (error) {
      broadcastMessage("Error occurred during process!"); // Ensure this function exists
  }
  
  
};

async function getLatestNumberForToday(todayPrefix: string): Promise<number> {
  const latestPrompt = await MidjourneyData.findOne({ imageNumber: { $regex: `^${todayPrefix}_\\d+_\\d+$` } })
    .sort({ createdAt: -1 })
    .exec();

  if (!latestPrompt || !latestPrompt.imageNumber) return -1;

  // 예: '250409_3_1' → 3 추출
  const match = latestPrompt.imageNumber.match(/^(\d{6})_(\d+)_\d+$/);
  return match ? parseInt(match[2], 10) : -1;
}

// Stop Process Function
export const stopProcess = async (req: Request, res: Response) => {
  console.log("Stop process requested"); // Add this to log when the endpoint is hit
  broadcastMessage("프로세스 중단 요청. 현재 iteration 완료 후 종료 예정");

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

export const rerunProcess = async (req: Request, res: Response) => {
  console.log('inside rerunProcess');
  const { originalPrompt, gptPrompt, midjourneyPrompt, imageNumber } = req.body;

  // 날짜 포맷: YYMMDD
  const todayPrefix = dayjs().format("YYMMDD");
        
  // 1️⃣ 오늘 날짜의 마지막 gptIndex 조회
  const latestNumber = await getLatestNumberForToday(todayPrefix); 
  let gptIndexOffset = latestNumber + 1; // 새로 시작할 gptIndex
  const imgNum = `${todayPrefix}_${gptIndexOffset}_1`;
  
  try {
    if (!originalPrompt || !gptPrompt || !midjourneyPrompt) {
      // return res.status(400).json({ success: false, error: 'Missing required fields' });
      console.log('error');
    }
    const promptId = await savePromptToDB(originalPrompt, gptPrompt, midjourneyPrompt, imgNum);
    await sendToMidjourney(midjourneyPrompt, promptId as string);
  } catch (error) {
    broadcastMessage("Error occurred during re-run process!"); // Ensure this function exists
}

};

// Define the routes for the backend
promptRoutes.get('/', fetchData);

promptRoutes.post('/start', startProcess);

promptRoutes.post('/stop', stopProcess);

promptRoutes.get('/allData', fetchData);

promptRoutes.post('/run-again', rerunProcess);


// Export the routes so they can be used in the main server
export default promptRoutes;

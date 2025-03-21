import mongoose, { Schema, Document, model } from 'mongoose';

interface IPrompt extends Document {
  originalPrompt: string;
  gptPrompt: string;
  midjourneyPrompt: string;
  imageUrls: string[];  // Array to store the image URLs
  imageNames?: string[]; // Optional array to store image names (if needed)
}

const PromptSchema: Schema = new Schema(
  {
    originalPrompt: { type: String, required: true },
    gptPrompt: { type: String, required: true },
    midjourneyPrompt: { type: String, required: true },
    imageUrls: { type: [String], required: true },  // Array of image URLs
    imageNames: { type: [String] },  // Optional array of image names (if needed)
  },
  { timestamps: true }
);

export const MidjourneyData = model<IPrompt>('MidjourneyData', PromptSchema, 'midjourneydata');

import mongoose from 'mongoose';

const randomPromptSchema = new mongoose.Schema({
  prompt: String, // Store the prompt text
});

const RandomPrompt = mongoose.model('RandomPrompt', randomPromptSchema);

export default RandomPrompt;
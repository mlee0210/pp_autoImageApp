import mongoose from 'mongoose';
import RandomPrompt from './models/randomPrompts'; // Import your model

// Define 10 mock prompts
const mockPrompts = [
  { prompt: '미래를 향한 도전' },
  { prompt: '하늘을 나는 새' },
  { prompt: '고요한 바다' },
  { prompt: '별이 빛나는 밤' },
  { prompt: '바람이 부는 언덕' },
  { prompt: '깊은 숲 속' },
  { prompt: '황금빛 해변' },
  { prompt: '고요한 새벽' },
  { prompt: '바다에서 바라본 일출' },
  { prompt: '최신화 도시' },
];

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pickypeople')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Insert mock data into the collection
    RandomPrompt.insertMany(mockPrompts)
      .then(() => {
        console.log('Mock data inserted successfully!');
      })
      .catch((error) => {
        console.error('Error inserting mock data:', error);
      })
      .finally(() => {
        mongoose.disconnect(); // Disconnect from MongoDB
      });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
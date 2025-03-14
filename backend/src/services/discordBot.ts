// // src/services/discordBot.ts
// import { Client, GatewayIntentBits } from 'discord.js';
// import connectDB from '../connectDB';
// import { Prompt } from '../models/prompt';

// class DiscordBot {
//   private client: Client;

//   constructor() {
//     this.client = new Client({
//       intents: [
//         GatewayIntentBits.Guilds,
//         GatewayIntentBits.GuildMessages,
//         GatewayIntentBits.MessageContent,
//       ],
//     });

//     this.client.once('ready', () => {
//       console.log('Bot is ready!');
//     });

//     this.client.on('messageCreate', async (message) => {
//       console.log('Message detected by bot');
//       // if (message.author.bot) return;
//       if (message.author.id === process.env.MIDJOURNEY_BOT_ID && message.attachments.size > 0) {
//         const firstAttachement = message.attachments.first();
//         if (firstAttachement) {
//           const imageUrl = firstAttachement.url;
//           const imageName = imageUrl ? imageUrl[0].split('/').pop() : 'unknown.jpg';

//           console.log("Image Url: ", imageUrl);
//           console.log("Image Name: ", imageName);
//         }
      

        
//         // if (imageUrl) {
//         //   // Assuming you have a way to identify the prompt ID
//         //   // await saveImageData(promptId, imageUrl[0], imageName);
//         // }
//       }
//     });

//     this.client.login(process.env.DISCORD_BOT_TOKEN as string);
//   }

//   // Function to save the image data
//   public async saveImageData(promptId: string, imageUrl: string, imageName: string) {
//     try {
//       const prompt = await Prompt.findById(promptId);
//       if (!prompt) {
//         console.error('Prompt not found');
//         return;
//       }
//       prompt.imageUrl = imageUrl;
//       prompt.imageName = imageName;
//       await prompt.save();
//       console.log('Prompt updated successfully:', prompt);
//     } catch (error) {
//       console.error('Error saving image data:', error);
//     }
//   }
// }

// export default DiscordBot;

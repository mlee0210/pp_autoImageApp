import mongoose from 'mongoose';
import RandomPrompt from './models/randomPrompts'; // Import your model

// Define 10 mock prompts
const mockPrompts = [
  { prompt:
    "Gold\n"+
    "\n"+
    "Meaning : 풍요로움\n"+
    "Main Metaphor  : 금빛 파도 처럼 보이는 곡물밭\n"+
    "Sub Metaphor  : 파도 위를 유영하는 꽃들로 이루어진 나비들\n"+
    "Lighting : 데이라이트 \n"+
    "Background : 드넓게 펼쳐진 금빛 곡물 밭이 파도처럼 일렁이는 모습 \n"+
    "Main Color(Hex-code) : Fortuna Gold #DAA520\n"+
    "Tone&mood : 자연속에서 피어나는 고급스러움 \n"+
    "Render : redshift render\n"+
    "Story : 황무지였던 곳이 금빛으로 퍼져나감을 표현하고, 금빛 컬러를 풍요로움의 사징으로 담아내어 마치 금빛 파도처럼 보여지는 신비로움 전달.\n"+
    "Point : hyperrealism, surreal\n"+
    "\n"+
    "etc : 밝고 고급스러운 느낌을 표현해줘\n"+
    "Midjourney parameters :  --ar 16:9 --v 6.1 --s 1000",
  },
  { prompt:
    "Happiness with nature\n"+
    "\n"+
    "Meaning : Happiness with nature\n"+
    "Main Metaphor  : 공중에 떠서 돌은 눈, 나뭇 가지는 입모양으로 미소를 만들어 낸다, smile branch\n"+
    "Sub Metaphor  : 메인 메타포 주위를 감싸며 날리는 꽃잎\n"+
    "Lighting : 데이라이트로 밝은 자연광\n"+
    "Background : 가운데 호수에 따스한 빛이 내리면서 수면이 반짝이고, 그 뒤로 숲과 하늘이 펼쳐져있다.\n"+
    "Main Color(Hex-code) : Blush Pink(#E6A4B4), Peach Blossom(#F4A7B9), sunset blush(#F5C2C2)\n"+
    "Tone&mood : 몽환적이고, 따스한 톤앤 무드\n"+
    "Render : redshift render\n"+
    "Story : 미소를 만들어낸 돌과 나뭇가지에 다양한 컬러의 꽃들이 피어나며 더 화려해지고, 배경도 가운데 중심으로 컬러가 화려해지며 퍼져나가는 모습처럼 그려진다.\n"+
    "Point : hyperrealism, surreal\n"+
    "\n"+
    "etc : 밝자연물의 재질감은 리얼하되 각 각의 오브제가 조화로워야하고, 공간 자체는 밝고 고급스러운 느낌을 표현, 문장의 마지막에는 꼭 --ar 16:9 --v 6.1 --s 1000 를 붙여줘"
  },
  { prompt:
    "Christmas\n"+
    "\n"+
    "Meaning : Sweet Christmas\n"+
    "Main Metaphor  : 크리스마스 디져트로 이루어진 크리스마스 트리\n"+
    "Sub Metaphor  : 공중에 떠 있는 크리스마스데코의 마카롱 열기구들, 살아 움직이는 인형과 진저브레드맨\n"+
    "Lighting : 해가 지는 저녁 7시 \n"+
    "Background : 눈이 가득 쌓인 핀란드같은 마을에 디져트로 만들어진 트리를 중심으로 주위에 각종 과자로 만들어진 집들과 크리스마스 요소들\n"+
    "Main Color(Hex-code) : Evergreen Magic(#4A7C59), Enchanted Gold(#F6C177)\n"+
    "Tone&mood : 판타지스럽고, 따스한 톤앤 무드\n"+
    "Render : redshift render\n"+
    "Story : 달콤함이 가득한 느낌과 판타지적인 요소들이 어우러져 동화같은 표현\n"+
    "Point : hyperrealism, surreal\n"+
    "\n"+
    "etc : 밝자연물의 재질감은 리얼하되 각 각의 오브제가 조화로워야하고, 공간 자체는 밝고 고급스러운 느낌을 표현, 문장의 마지막에는 꼭 --ar 16:9 --v 6.1 --s 1000 를 붙여줘"
  }
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
// src/App.tsx
import React, { useState, useEffect } from 'react';
import Button from './components/Button';
import ImageGallery from './components/ImageGallery';
import axios from 'axios';
import './App.css';  // Import the App.css file here
// import NotificationComponent from './components/NotificationComponent';  // Import NotificationComponent

// WebSocket connection setup
// const createWebSocketConnection = (callback: (message: string) => void) => {
//   const socket = new WebSocket('ws://localhost:5001'); // Replace with your backend WebSocket URL
  
//   socket.onopen = () => {
//     console.log('WebSocket connected');
//   };
  
//   socket.onmessage = (event) => {
//     // Trigger the callback when a message is received
//     callback(event.data);
//   };

//   socket.onerror = (error) => {
//     console.log('WebSocket error:', error);
//   };

//   socket.onclose = () => {
//     console.log('WebSocket connection closed');
//   };

//   return socket;
// };

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<any[]>([]);  // Default as an empty array
  const [loading, setLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  // const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);

  const API_BASE_URL = "http://localhost:5001";

  const startCycle = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/prompts/start`);
      // setPrompts((prevPrompts) => [...prevPrompts, response.data]);
      console.log("FINISHED startCycle")
    } catch (error) {
      console.error('Error starting cycle', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGallery = async () => {
    console.log('update button clicked');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/prompts/allData`);
      setPrompts(response.data); // Replace existing images with the new ones
    } catch (error) {
      console.error('Error fetching prompts', error);
    }
  };

  // Call app.get('/') on render
  useEffect(() => {
    // Fetch data from the backend when the component renders
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/prompts/`);
        setPrompts(response.data); // Replace existing images with the new ones
      } catch (error) {
        console.error('Error fetching data from /', error);
      }
    };

    fetchData();

    // Set up the WebSocket connection when the component mounts
    // const socket = createWebSocketConnection((message: string) => {
    //   // On receiving a message, update the notification state
    //   setNotificationMessage(message);
    //   setIsNotificationVisible(true);

    //   // Hide the notification after 5 seconds
    //   setTimeout(() => {
    //     setIsNotificationVisible(false);
    //   }, 5000);
    // });

    // // Clean up the WebSocket connection when the component unmounts
    // return () => socket.close();
  }, []);

  return (
    <div className="app">
      <Button label="START" onClick={startCycle} disabled={loading} />
      <Button label="STOP" onClick={() => {}} disabled={false} />
      <Button label="UPDATE" onClick={updateGallery} disabled={loading} />
      
      {/* Show notification if there is a message */}
      {/* {isNotificationVisible && <NotificationComponent message={notificationMessage} />} */}

      {/* Check if 'prompts' is a valid array before rendering ImageGallery */}
      <ImageGallery prompts={Array.isArray(prompts) ? prompts : []} />
    </div>
  );
};

export default App;

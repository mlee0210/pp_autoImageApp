import React, { useState, useEffect } from "react";
import Button from "./components/Button";
import ImageGallery from "./components/ImageGallery";
import axios from "axios";
import "./App.css"; // Import the App.css file here

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<any[]>([]); // Default as an empty array
  const [loading, setLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [socket, setSocket] = useState<WebSocket | null>(null); // WebSocket state
  const [isProcessing, setIsProcessing] = useState(false); // Track whether the process is running
  const [isIterationComplete, setIsIterationComplete] = useState(true); // Track if current iteration is complete

  const API_BASE_URL = "http://localhost:5001";
  const WS_URL = "ws://localhost:8080"; // WebSocket server URL

  useEffect(() => {
    // Establish WebSocket connection
    const socketInstance = new WebSocket(WS_URL);
    setSocket(socketInstance);

    socketInstance.onmessage = (event) => {
      setNotificationMessage(event.data);
      console.log("Received WebSocket Message:", event.data);

      // If the message indicates iteration completion, update the state
      if (event.data === "Iteration Complete") {
        setIsIterationComplete(true); // Enable START button after iteration is complete
      }
    };

    socketInstance.onopen = () => console.log("WebSocket Connected");
    socketInstance.onclose = () => console.log("WebSocket Disconnected");

    return () => socketInstance.close(); // Clean up on unmount
  }, []);

  const startCycle = async () => {
    setLoading(true);
    setIsProcessing(true); // Set isProcessing to true when the process starts
    setIsIterationComplete(false); // Set iteration as not complete when process starts
    try {
      await axios.post(`${API_BASE_URL}/api/prompts/start`);
      console.log("Process started");
    } catch (error) {
      console.error("Error starting cycle", error);
    } finally {
      setLoading(false);
    }
  };

  const stopCycle = async () => {
    setLoading(true); // Show loading while stopping
    try {
      await axios.post(`${API_BASE_URL}/api/prompts/stop`);
      console.log("Process stopped");
    } catch (error) {
      console.error("Error stopping cycle", error);
    } finally {
      setLoading(false);
      setIsProcessing(false); // Set isProcessing to false when stopping the process
      setIsIterationComplete(false); // Keep iteration incomplete until confirmation
    }
  };

  const updateGallery = async () => {
    console.log("update button clicked");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/prompts/allData`);
      setPrompts(response.data); // Replace existing images with new ones
    } catch (error) {
      console.error("Error fetching prompts", error);
    }
  };

  useEffect(() => {
    // Fetch data from the backend when the component renders
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/prompts/`);
        setPrompts(response.data);
      } catch (error) {
        console.error("Error fetching data from /", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="app">
      <Button 
        label="START" 
        onClick={startCycle} 
        disabled={loading || isProcessing || !socket || !isIterationComplete} 
      />
      <Button 
        label="STOP" 
        onClick={stopCycle} 
        disabled={!isProcessing || !socket}  // Make STOP button enabled when process is running
      />
      <Button 
        label="UPDATE" 
        onClick={updateGallery} 
        disabled={loading || isProcessing || !isIterationComplete} 
      />

      {notificationMessage && <p className="notification">{notificationMessage}</p>}

      <ImageGallery prompts={Array.isArray(prompts) ? prompts : []} />
    </div>
  );
};

export default App;

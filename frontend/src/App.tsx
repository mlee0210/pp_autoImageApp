import React, { useState, useEffect } from "react";
import Button from "./components/Button";
import ImageGallery from "./components/ImageGallery";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "http://localhost:5001";
const WS_URL = "ws://localhost:8080";
const ITEMS_PER_PAGE = 10;

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIterationComplete, setIsIterationComplete] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const socketInstance = new WebSocket(WS_URL);
    setSocket(socketInstance);

    socketInstance.onmessage = (event) => {
      setNotificationMessage(event.data);
      if (event.data === "Iteration Complete") {
        setIsIterationComplete(true);
      }
    };

    socketInstance.onopen = () => console.log("WebSocket Connected");
    socketInstance.onclose = () => console.log("WebSocket Disconnected");

    return () => socketInstance.close();
  }, []);

  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/prompts/`, {
        params: { page, limit: ITEMS_PER_PAGE },
      });
      setPrompts(response.data.prompts);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setPrompts([]);
    setCurrentPage(page);
  };

  const startCycle = async () => {
    setLoading(true);
    setIsProcessing(true);
    setIsIterationComplete(false);
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
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/prompts/stop`);
      console.log("Process stopped");
    } catch (error) {
      console.error("Error stopping cycle", error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      <Button label="START" onClick={startCycle} disabled={loading || isProcessing || !isIterationComplete} />
      <Button label="STOP" onClick={stopCycle} disabled={!isProcessing} />
      <Button label="UPDATE" onClick={() => handlePageChange(1)} disabled={loading || isProcessing || !isIterationComplete} />
      {notificationMessage && <p className="notification">{notificationMessage}</p>}
      <ImageGallery prompts={prompts} />
      <div className="pagination">
        <Button label="Previous" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} />
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index + 1}
            className={currentPage === index + 1 ? "active" : ""}
            onClick={() => handlePageChange(index + 1)}
            disabled={loading}
          >
            {index + 1}
          </button>
        ))}
        <Button label="Next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading} />
      </div>
    </div>
  );
};

export default App;

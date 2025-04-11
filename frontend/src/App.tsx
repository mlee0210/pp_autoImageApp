import React, { useState, useEffect } from "react";
import Button from "./components/Button";
import ImageGallery from "./components/ImageGallery";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "http://localhost:5001";
const WS_URL = "ws://localhost:8080";
const ITEMS_PER_PAGE = 10;
const PAGE_GROUP_SIZE = 10;

const getPageGroup = (currentPage: number, totalPages: number) => {
  const start = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1;
  const end = Math.min(start + PAGE_GROUP_SIZE - 1, totalPages);
  const group = [];
  for (let i = start; i <= end; i++) {
    group.push(i);
  }
  return group;
};

const App: React.FC = () => {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIterationComplete, setIsIterationComplete] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [userPrompt, setUserPrompt] = useState("");
  const [chatGPTNumber, setChatGPTNumber] = useState("");
  const [totalNumber, setTotalNumber] = useState("");

  useEffect(() => {
    const socketInstance = new WebSocket(WS_URL);
    setSocket(socketInstance);

    socketInstance.onmessage = (event) => {
      setNotificationMessage(event.data);
      if (event.data === "프로세스 완료") {
        setIsIterationComplete(true);
        setIsProcessing(false);
        setLoading(false);
      } else if (event.data === "Error occurred during process!") {
        setIsIterationComplete(true);
        setIsProcessing(false); // 에러 시에도 버튼 다시 살려야 함
      }
    };

    socketInstance.onopen = () => console.log("WebSocket Connected");
    socketInstance.onclose = () => console.log("WebSocket Disconnected");

    return () => socketInstance.close();
  }, []);

  // useEffect(() => {
  //   console.log("Start button check:", {
  //     loading,
  //     isProcessing,
  //     userPrompt,
  //     chatGPTNumber,
  //     totalNumber,
  //     isStartDisabled,
  //     isIterationComplete,
  //   });
  // }, [loading, isProcessing, userPrompt, chatGPTNumber, totalNumber]);

  const handleUpdateClick = () => {
    setPrompts([]);
    fetchData(1);
    setCurrentPage(1);
  };

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
      await axios.post(`${API_BASE_URL}/api/prompts/start`, {
        prompt: userPrompt,
        chatGPTNumber: parseInt(chatGPTNumber),
        totalNumber: parseInt(totalNumber),
      });
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

      setTimeout(() => {
        setIsProcessing(false); // allow START again only after backend done
        // setLoading(false);
      }, 30000); // 30 seconds delay

    } catch (error) {
        console.error("Error stopping cycle", error);
        setLoading(false);
        setIsProcessing(false); // fallback
    }
  };

  const isStartDisabled =
    loading ||
    isProcessing &&
    userPrompt.trim() === "" ||
    chatGPTNumber.trim() === "" ||
    totalNumber.trim() === "";

  return (
    <div className="zoom-wrapper">
      <div className="app">
        <div className="form-container">
          <div className="form-group-row">
            {/* Original Prompt */}
            <div className="form-group">
              <label className="form-label">Original Prompt</label>
              <textarea
                rows={10}
                placeholder="Type your custom prompt..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={loading || isProcessing}
                className="textarea"
              />
            </div>

            {/* Side Inputs */}
            <div className="form-group">
              <label className="form-label">총 이미지 세트 수</label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 10"
                value={totalNumber}
                onChange={(e) => setTotalNumber(e.target.value)}
                disabled={loading || isProcessing}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">ChatGPT 프롬프트 당 이미지 세트 수</label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 2"
                value={chatGPTNumber}
                onChange={(e) => setChatGPTNumber(e.target.value)}
                disabled={loading || isProcessing}
                className="input"
              />
            </div>
          </div>
        </div>
        <div className="button-row">
          <Button label="START" onClick={startCycle} disabled={isStartDisabled} />
          <Button label="STOP" onClick={stopCycle} disabled={!isProcessing} />
          <Button
            label="UPDATE"
            onClick={handleUpdateClick}
            disabled={loading || isProcessing || !isIterationComplete}
          />
        </div>

        {notificationMessage && <p className="notification">{notificationMessage}</p>}

        <hr className="section-divider" />

        <div className="gallery-wrapper">
          <ImageGallery prompts={prompts} />
        </div>

        <div className="pagination">
          <Button
            label="Previous"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          />
          {getPageGroup(currentPage, totalPages).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={currentPage === page ? "active" : ""}
              disabled={loading}
            >
              {page}
            </button>
          ))}
          <Button
            label="Next"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          />
        </div>
      </div>
    </div>
  );
};

export default App;

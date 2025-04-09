import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";

const API_BASE_URL = "http://localhost:5001";

type ImageGalleryProps = {
  prompts: {
    originalPrompt: string;
    gptPrompt: string;
    midjourneyPrompt: string;
    finalPrompt: string;
    imageUrls: string[];
    imageNumber: string;
  }[] | undefined;
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ prompts = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [currentPromptImages, setCurrentPromptImages] = useState<string[]>([]);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const openModal = (imageUrls: string[], index: number) => {
    setCurrentPromptImages(imageUrls);
    setModalImageUrl(imageUrls[index]);
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageUrl('');
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % currentPromptImages.length;
    setCurrentImageIndex(nextIndex);
    setModalImageUrl(currentPromptImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex =
      (currentImageIndex - 1 + currentPromptImages.length) % currentPromptImages.length;
    setCurrentImageIndex(prevIndex);
    setModalImageUrl(currentPromptImages[prevIndex]);
  };

  useEffect(() => {
    if (isModalOpen) {
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowLeft') prevImage();
        else if (event.key === 'ArrowRight') nextImage();
        else if (event.key === 'Escape') closeModal();
      };

      window.addEventListener('keydown', handleKeydown);
      return () => window.removeEventListener('keydown', handleKeydown);
    }
  }, [isModalOpen, currentImageIndex, currentPromptImages]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
      closeModal();
    }
  };

  const handleModalContentClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const getMidjourneyLink = (imageUrl: string) => {
    const regex = /\/([^/]+)\/0_0.png$/;
    const match = imageUrl.match(regex);
    if (match) {
      const jobId = match[1];
      return `https://www.midjourney.com/jobs/${jobId}?index=0`;
    }
    return '#';
  };

  const handleRunItAgain = async (prompt: {
    originalPrompt: string;
    gptPrompt: string;
    midjourneyPrompt: string;
    imageNumber: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/prompts/run-again`, {
        originalPrompt: prompt.originalPrompt,
        gptPrompt: prompt.gptPrompt,
        midjourneyPrompt: prompt.midjourneyPrompt,
        imageNumber: prompt.imageNumber,
      });
    } catch (error) {
      console.error('Run It Again Error:', error);
      alert('Error running it again.');
    }
  };

  const TruncatedText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
      <div className="truncated-text">
        <p className={isExpanded ? 'expanded' : 'collapsed'}>{text}</p>
        {text.split(' ').length > 10 && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="read-more">
            {isExpanded ? 'Read Less' : 'Read More'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="gallery-container">
      {prompts.length > 0 ? (
        prompts.map((prompt, index) => (
          <div className="image-item" key={index}>
            <div className="prompts-column" style={{ whiteSpace: 'pre-line' }}>
              <h3>Image Number</h3>
              <p>{prompt.imageNumber}</p>

              <h3>Original Prompt</h3>
              <TruncatedText text={prompt.originalPrompt} />

              <h3>ChatGPT Prompt</h3>
              <TruncatedText text={prompt.gptPrompt} />

              <h3>Midjourney Prompt</h3>
              <TruncatedText text={prompt.midjourneyPrompt} />

              <button onClick={() => window.open(getMidjourneyLink(prompt.imageUrls[0]), '_blank')}>
                View in Midjourney
              </button>

              <button
                onClick={() =>
                  handleRunItAgain({
                    originalPrompt: prompt.originalPrompt,
                    gptPrompt: prompt.gptPrompt,
                    midjourneyPrompt: prompt.midjourneyPrompt,
                    imageNumber: prompt.imageNumber,
                  })
                }
              >
                Run It Again
              </button>
            </div>

            <div className="images-column-container">
              {prompt.imageUrls.map((imageUrl, idx) => (
                <div
                  key={idx}
                  className="image-column"
                  onClick={() => openModal(prompt.imageUrls, idx)}
                >
                  <img src={imageUrl} alt={`Generated image ${idx + 1}`} className="gallery-image" />
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p>No prompts available.</p>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content" ref={modalContentRef} onClick={handleModalContentClick}>
            <button className="close-modal" onClick={closeModal}>
              X
            </button>
            <button className="modal-nav-left-button" onClick={prevImage}>
              {'<'}
            </button>
            <img src={modalImageUrl} alt="Modal image" className="modal-image" />
            <button className="modal-nav-right-button" onClick={nextImage}>
              {'>'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

import React, { useState, useEffect, useRef } from 'react';

type ImageGalleryProps = {
  prompts: {
    originalPrompt: string;
    gptPrompt: string;
    midjourneyPrompt: string;
    finalPrompt: string;
    imageUrls: string[]; // Array of 4 image URLs
  }[] | undefined; // Accept undefined as a valid type
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ prompts = [] }) => { // Default to empty array
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>(""); 
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0); // Store the index of the current image in the modal
  const [currentPromptImages, setCurrentPromptImages] = useState<string[]>([]); // Store the images of the current prompt
  
  const modalContentRef = useRef<HTMLDivElement>(null); // Reference to modal content for detecting outside click

  // Function to open the modal and set the current image
  const openModal = (imageUrls: string[], index: number) => {
    console.log('Opening modal with image URL:', imageUrls[index]); // Debugging log
    setCurrentPromptImages(imageUrls); // Set the current prompt images
    setModalImageUrl(imageUrls[index]); // Set the initial image for the modal
    setCurrentImageIndex(index); // Set the initial index
    setIsModalOpen(true); // Open the modal
  };

  // Function to close the modal
  const closeModal = () => {
    console.log('Closing modal'); // Debugging log
    setIsModalOpen(false);
    setModalImageUrl("");
    setCurrentImageIndex(0);
  };

  // Function to navigate to the next image in the modal
  const nextImage = () => {
    if (currentImageIndex < currentPromptImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setModalImageUrl(currentPromptImages[currentImageIndex + 1]);
    } else {
      setCurrentImageIndex(0);
      setModalImageUrl(currentPromptImages[0]);
    }
  };

  // Function to navigate to the previous image in the modal
  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setModalImageUrl(currentPromptImages[currentImageIndex - 1]);
    } else {
      setCurrentImageIndex(currentPromptImages.length - 1);
      setModalImageUrl(currentPromptImages[currentPromptImages.length - 1]);
    }
  };

  // Handle keyboard events for navigation and closing the modal
  useEffect(() => {
    if (isModalOpen) {
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowLeft') {
          prevImage();
        } else if (event.key === 'ArrowRight') {
          nextImage();
        } else if (event.key === 'Escape') {
          closeModal();
        }
      };

      window.addEventListener('keydown', handleKeydown);

      // Cleanup the event listener when the modal is closed
      return () => {
        window.removeEventListener('keydown', handleKeydown);
      };
    }
  }, [isModalOpen, currentImageIndex, currentPromptImages]);

  // Close the modal if click happens outside of the modal content
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
      closeModal();
    }
  };

  // Prevent click events inside modal content from closing the modal
  const handleModalContentClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  // Function to get the Midjourney job link from the first image URL
  const getMidjourneyLink = (imageUrl: string) => {
    const regex = /\/([^/]+)\/0_0.png$/; // Regex to extract the ID
    const match = imageUrl.match(regex);
    if (match) {
      const jobId = match[1]; // Extracted job ID
      return `https://www.midjourney.com/jobs/${jobId}?index=0`; // Construct the URL
    }
    return '#'; // Return a default link if the regex fails
  };

  const TruncatedText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    console.log(text.split(" ").length);

    return (
      <div className="truncated-text">
        <p className={isExpanded ? "expanded" : "collapsed"}>{text}</p>
        {text.split(" ").length > 10 && (  // Show 'Read More' only if text is long
          <button onClick={() => setIsExpanded(!isExpanded)} className="read-more">
            {isExpanded ? "Read Less" : "Read More"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="gallery-container">
      {/* Check if 'prompts' is an array and has items */}
      {prompts.length > 0 ? (
        prompts.map((prompt, index) => (
          <div className="image-item" key={index}>
            {/* Column 1: originalPrompt, gptPrompt, midjourneyPrompt, and Go to Midjourney button */}
            <div className="prompts-column" style={{ whiteSpace: "pre-line" }}>
              <h3>Original Prompt</h3>
              <TruncatedText text={prompt.originalPrompt} />
              <h3>ChatGPT Prompt</h3>
              <TruncatedText text={prompt.gptPrompt} />
              <h3>Midjourney Prompt</h3>
              <TruncatedText text={prompt.midjourneyPrompt} />

              {/* "Go to Midjourney" button */}
              <button 
                onClick={() => window.open(getMidjourneyLink(prompt.imageUrls[0]), '_blank')}
              >
                View in Midjourney
              </button>
            </div>

            {/* Columns 2 - 5: imageUrls */}
            <div className="images-column-container">
              {prompt.imageUrls.map((imageUrl, idx) => (
                <div
                  key={idx}
                  className="image-column"
                  onClick={() => openModal(prompt.imageUrls, idx)} // Open modal on image click
                >
                  <img src={imageUrl} alt={`Generated image ${idx + 1}`} className="gallery-image" />
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p>No prompts available.</p> // Display a message if prompts array is empty or not available
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content" ref={modalContentRef} onClick={handleModalContentClick}>
            <button className="close-modal" onClick={closeModal}>X</button>
            
            {/* Navigation Buttons for Image */}
            <button className="modal-nav-left-button" onClick={prevImage}>{"<"}</button>
            <img src={modalImageUrl} alt="Modal image" className="modal-image" />
            <button className="modal-nav-right-button" onClick={nextImage}>{">"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

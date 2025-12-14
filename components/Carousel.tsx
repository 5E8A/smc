import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface CarouselProps {
  images: string[];
}

const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-mc-surface border border-white/5 flex items-center justify-center text-gray-500 rounded-lg">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="font-sans text-sm">No images available</p>
        </div>
      </div>
    );
  }

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  return (
    <div className="relative group w-full h-full">
      {/* Main Image Container */}
      <div className="relative w-full aspect-video bg-[#050505] overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Subtle gradient overlay at bottom for dots */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
      </div>

      {/* Navigation Buttons - Hidden by default, show on hover */}
      <button 
        className="absolute top-1/2 -translate-y-1/2 left-4 z-20 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-mc-accent hover:text-black backdrop-blur-sm" 
        onClick={prevSlide}
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        className="absolute top-1/2 -translate-y-1/2 right-4 z-20 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-mc-accent hover:text-black backdrop-blur-sm" 
        onClick={nextSlide}
      >
        <ChevronRight size={24} />
      </button>

      {/* Modern Dots */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
        {images.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            className={`cursor-pointer w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === slideIndex 
                ? 'bg-white w-6' 
                : 'bg-white/30 hover:bg-white/60'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
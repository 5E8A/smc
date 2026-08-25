import { useState } from "react";
import { CaretLeftIcon, CaretRightIcon, ImageIcon } from "@phosphor-icons/react";
import SmartImage from "@/components/SmartImage";

interface CarouselProps {
  images: string[];
}

const Carousel = ({ images }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-white/5 bg-mc-surface text-gray-500">
        <div className="text-center">
          <ImageIcon className="mx-auto mb-2 size-12 opacity-30" />
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
    <div className="group relative size-full">
      {/* Main Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#050505]">
        <SmartImage src={images[currentIndex]} alt={`Slide ${currentIndex + 1}`} className="size-full" priority="low" />

        {/* Subtle gradient overlay at bottom for dots */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>

      {/* Navigation Buttons - Hidden by default, show on hover */}
      <button
        className="absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-mc-green hover:text-black"
        onClick={prevSlide}
      >
        <CaretLeftIcon size={24} />
      </button>

      <button
        className="absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-mc-green hover:text-black"
        onClick={nextSlide}
      >
        <CaretRightIcon size={24} />
      </button>

      {/* Modern Dots */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2">
        {images.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            className={`size-2 cursor-pointer rounded-full transition-all duration-300 ${
              currentIndex === slideIndex ? "w-6 bg-white" : "bg-white/30 hover:bg-white/60"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;

import { useState } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { assetUrl } from "../api";
import { isVideoSrc, videoPosterSrc } from "../lib/videoAsset";

const resolveSrc = (src: string) => (src.startsWith("/smc/assets/") ? assetUrl(src) : src);

const Carousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

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

  return (
    <div className="group relative size-full">
      <div className="relative aspect-video w-full overflow-hidden bg-[#050505]">
        {isVideoSrc(images[currentIndex]) ? (
          <video
            key={images[currentIndex]}
            src={resolveSrc(images[currentIndex])}
            poster={resolveSrc(videoPosterSrc(images[currentIndex]))}
            muted
            loop
            autoPlay
            playsInline
            className="size-full object-cover"
          />
        ) : (
          <img
            src={resolveSrc(images[currentIndex])}
            alt={`Slide ${currentIndex + 1}`}
            loading="lazy"
            className="size-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>

      <button
        className="absolute top-1/2 left-3 z-20 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-green-500 hover:text-black"
        onClick={prevSlide}
      >
        <CaretLeftIcon size={18} />
      </button>

      <button
        className="absolute top-1/2 right-3 z-20 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-green-500 hover:text-black"
        onClick={nextSlide}
      >
        <CaretRightIcon size={18} />
      </button>

      <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-1.5">
        {images.map((_, slideIndex) => (
          <div
            key={slideIndex}
            onClick={() => setCurrentIndex(slideIndex)}
            className={`size-2 cursor-pointer rounded-full transition-all duration-300 ${
              currentIndex === slideIndex ? "w-5 bg-white" : "bg-white/30 hover:bg-white/60"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;

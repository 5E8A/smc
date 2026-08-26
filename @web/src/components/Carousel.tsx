import { useState } from "react";
import { CaretLeftIcon, CaretRightIcon, CornersOutIcon, ImageIcon } from "@phosphor-icons/react";
import SmartImage from "@/components/SmartImage";
import Lightbox from "@/components/Lightbox";
import { useLanguage } from "@/context/useLanguage";

interface CarouselProps {
  images: string[];
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent";

const Carousel = ({ images }: CarouselProps) => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

        {/* Fullscreen open trigger covering the image */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t.lightbox.open}
          className={`absolute inset-0 z-10 cursor-zoom-in ${focusRing}`}
        ></button>

        {/* Expand icon */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t.lightbox.open}
          className={`absolute top-3 right-3 z-30 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-mc-green hover:text-black ${focusRing}`}
        >
          <CornersOutIcon size={20} />
        </button>
      </div>
      {/* Navigation Buttons - Hidden by default, show on hover */}
      <button
        type="button"
        aria-label={t.lightbox.prev}
        className={`absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-mc-green hover:text-black ${focusRing}`}
        onClick={prevSlide}
      >
        <CaretLeftIcon size={24} />
      </button>

      <button
        type="button"
        aria-label={t.lightbox.next}
        className={`absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-mc-green hover:text-black ${focusRing}`}
        onClick={nextSlide}
      >
        <CaretRightIcon size={24} />
      </button>

      {/* Modern Dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-3 py-2 backdrop-blur-sm">
        {images.map((slide, slideIndex) => (
          <button
            key={slideIndex}
            type="button"
            aria-label={`Slide ${slideIndex + 1}`}
            aria-current={currentIndex === slideIndex || undefined}
            onClick={() => goToSlide(slideIndex)}
            className={`h-2 cursor-pointer rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              currentIndex === slideIndex ? "w-6 bg-white" : "w-2 bg-white/30 hover:bg-white/60"
            }`}
          ></button>
        ))}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          index={currentIndex}
          onIndexChange={setCurrentIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default Carousel;

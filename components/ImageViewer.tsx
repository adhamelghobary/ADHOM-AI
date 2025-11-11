
import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import { SparklesIcon, DownloadIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import BeforeAfterSlider from './BeforeAfterSlider';

const loadingMessages = [
    'Compositing your scene...',
    'Applying advanced lighting...',
    'Perfecting the final details...',
    'ADHOM AI is crafting your image.'
];

// A dedicated component for the welcome screen to keep the main component clean.
const WelcomePlaceholder = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-transparent relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute top-1/2 left-1/2 w-[300%] h-1 bg-[var(--accent-color)] opacity-0" style={{ animation: 'beam-one 8s ease-in-out infinite' }}/>
            <div className="absolute top-1/2 left-1/2 w-[300%] h-1 bg-[var(--accent-color)] opacity-0" style={{ animation: 'beam-two 8s ease-in-out infinite', animationDelay: '4s' }}/>
        </div>

        <div className="relative z-10">
            <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-[var(--accent-color)] animate-icon-glow mx-auto" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-200">Welcome to ADHOM AI Creative Studio</h2>
            <p className="mt-2 max-w-sm text-gray-400 text-sm sm:text-base">
                Begin by uploading your product image, then provide a style reference or a text prompt to transform your vision into reality.
            </p>
        </div>
    </div>
);


interface ImageViewerProps {
    productImage: { base64: string, mimeType: string } | null;
    generatedImage: { base64: string, mimeType: string } | null;
    generatedImages?: Array<{ base64: string, mimeType: string }> | null;
    isGenerating: boolean;
    aspectRatio: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ productImage, generatedImage, generatedImages, isGenerating, aspectRatio }) => {
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);

    // Effect to cycle through loading messages
    useEffect(() => {
        let intervalId: number | undefined;
        if (isGenerating) {
            let i = 0;
            intervalId = window.setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 2500);
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isGenerating]);

    const hasZoomableImages = generatedImages && generatedImages.length > 0;

    const handleCloseZoom = () => setZoomedImageIndex(null);
    const handleNextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (zoomedImageIndex !== null && hasZoomableImages) {
            setZoomedImageIndex((zoomedImageIndex + 1) % generatedImages.length);
        }
    };
    const handlePrevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (zoomedImageIndex !== null && hasZoomableImages) {
            setZoomedImageIndex((zoomedImageIndex - 1 + generatedImages.length) % generatedImages.length);
        }
    };
    
    // Keyboard navigation for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (zoomedImageIndex !== null) {
                if (e.key === 'Escape') handleCloseZoom();
                if (e.key === 'ArrowRight') handleNextImage();
                if (e.key === 'ArrowLeft') handlePrevImage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [zoomedImageIndex, generatedImages]);
    
    const productImageUrl = productImage ? `data:${productImage.mimeType};base64,${productImage.base64}` : null;
    const generatedImageUrl = generatedImage ? `data:${generatedImage.mimeType};base64,${generatedImage.base64}` : null;

    const containerStyle: React.CSSProperties = {
        aspectRatio: aspectRatio.replace(':', ' / '),
    };

    const renderContent = () => {
        if (isGenerating) {
            return <Loader><p className="mt-4 text-lg font-semibold text-center text-[var(--accent-color)] uppercase tracking-wider">{loadingMessage}</p></Loader>;
        }
        if (productImageUrl && generatedImageUrl) {
            return <BeforeAfterSlider beforeSrc={productImageUrl} afterSrc={generatedImageUrl} />;
        }
        if (hasZoomableImages) {
            return (
                <>
                    <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
                        {generatedImages.map((image, index) => (
                            <div key={index} 
                                className="relative group rounded-lg overflow-hidden cursor-zoom-in"
                                onClick={() => setZoomedImageIndex(index)}
                                role="button"
                                aria-label={`View image ${index + 1} in full screen`}
                            >
                                <img 
                                    src={`data:${image.mimeType};base64,${image.base64}`} 
                                    alt={`Generated image ${index + 1}`} 
                                    className="w-full h-full object-cover" 
                                />
                                <a
                                    href={`data:${image.mimeType};base64,${image.base64}`}
                                    download={`AI-Generated-Image-${index + 1}.jpeg`}
                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-[var(--accent-color)] transition-all transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                                    aria-label="Download image"
                                    title="Download Image"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                </a>
                            </div>
                        ))}
                    </div>

                    {zoomedImageIndex !== null && (
                        <div 
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast" 
                            onClick={handleCloseZoom}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Image lightbox"
                        >
                            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                                <img 
                                    src={`data:${generatedImages[zoomedImageIndex].mimeType};base64,${generatedImages[zoomedImageIndex].base64}`} 
                                    alt={`Zoomed generated image ${zoomedImageIndex + 1}`}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                />

                                <button onClick={handleCloseZoom} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors" aria-label="Close lightbox">
                                    <CloseIcon className="w-6 h-6"/>
                                </button>
                                
                                <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors" aria-label="Previous image">
                                    <ChevronLeftIcon className="w-8 h-8"/>
                                </button>
                                
                                <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors" aria-label="Next image">
                                    <ChevronRightIcon className="w-8 h-8"/>
                                </button>

                                <a
                                    href={`data:${generatedImages[zoomedImageIndex].mimeType};base64,${generatedImages[zoomedImageIndex].base64}`}
                                    download={`AI-Generated-Image-${zoomedImageIndex + 1}.jpeg`}
                                    className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-color)] text-white rounded-full hover:bg-indigo-500 transition-colors shadow-lg"
                                    aria-label="Download current image"
                                    title="Download Image"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    <span>Download</span>
                                </a>
                            </div>
                        </div>
                    )}
                </>
            );
        }
        if (generatedImageUrl) {
            return (
                <div className="relative w-full h-full">
                    <img src={generatedImageUrl} alt="Generated Art" className="w-full h-full object-contain rounded-lg" />
                </div>
            );
        }
        if (productImageUrl) {
            return (
                <div className="relative w-full h-full group">
                    <img src={productImageUrl} alt="Your Product" className="w-full h-full object-contain rounded-lg" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none">
                        <p className="text-white text-center font-semibold text-xl p-4 drop-shadow-lg">
                            Ready for transformation.
                            <br/>
                            <span className="text-base font-normal text-gray-300">Add a creative direction to begin.</span>
                        </p>
                    </div>
                </div>
            );
        }
        return <WelcomePlaceholder />;
    };

    return (
        <div className="flex-grow flex items-center justify-center w-full h-full p-2 sm:p-4 lg:p-8 relative overflow-hidden">
            <div className="w-full max-w-4xl relative" style={containerStyle}>
                {renderContent()}
            </div>
        </div>
    );
};

export default ImageViewer;

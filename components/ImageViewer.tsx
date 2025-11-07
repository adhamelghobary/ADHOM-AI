import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import { SparklesIcon } from './Icons';
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
            <SparklesIcon className="w-16 h-16 mb-4 text-[var(--accent-color)] animate-icon-glow" />
            <h2 className="text-2xl font-bold text-gray-200">Welcome to ADHOM AI Creative Studio</h2>
            <p className="mt-2 max-w-sm text-gray-400">
                Begin by uploading your product image, then provide a style reference or a text prompt to transform your vision into reality.
            </p>
        </div>
    </div>
);


interface ImageViewerProps {
    productImage: { base64: string, mimeType: string } | null;
    generatedImage: { base64: string, mimeType: string } | null;
    isGenerating: boolean;
    aspectRatio: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ productImage, generatedImage, isGenerating, aspectRatio }) => {
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

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
    
    const productImageUrl = productImage ? `data:${productImage.mimeType};base64,${productImage.base64}` : null;
    const generatedImageUrl = generatedImage ? `data:${generatedImage.mimeType};base64,${generatedImage.base64}` : null;

    // The container now consistently uses the aspect ratio, preventing layout shifts.
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
        <div className="flex-grow flex items-center justify-center w-full h-full lg:p-8 relative overflow-hidden">
            <div className="w-full max-w-4xl relative" style={containerStyle}>
                {renderContent()}
            </div>
        </div>
    );
};

export default ImageViewer;
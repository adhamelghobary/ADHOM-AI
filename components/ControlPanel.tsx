
import React from 'react';
import { ExportSettings, ImageFile, UpscaleTarget } from '../types';
import { ExportIcon, SparklesIcon, ArrowsExpandIcon, DownloadIcon } from './Icons';
import AccordionItem from './AccordionItem';
import ExportControls from './ExportControls';
import ImageUploader from './ImageUploader';

interface ControlPanelProps {
    exportSettings: ExportSettings;
    setExportSettings: (settings: ExportSettings) => void;
    productImage: ImageFile | null;
    setProductImage: (image: ImageFile | null) => void;
    referenceImage: ImageFile | null;
    setReferenceImage: (image: ImageFile | null) => void;
    customPrompt: string;
    setCustomPrompt: (prompt: string) => void;
    onGetSuggestions: () => void;
    isGeneratingSuggestions: boolean;
    // Generation props
    onGenerate: () => void;
    canGenerate: boolean;
    isLoading: boolean;
    generatedImage: { base64: string; mimeType: string } | null;
    isUpscaling: false | UpscaleTarget;
    onUpscale: (target: UpscaleTarget) => void;
    isOnline: boolean;
    upscaleMenuRef: React.RefObject<HTMLDivElement>;
    isUpscaleMenuOpen: boolean;
    setIsUpscaleMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const {
        exportSettings, setExportSettings,
        productImage, setProductImage, referenceImage, setReferenceImage,
        customPrompt, setCustomPrompt, onGetSuggestions, isGeneratingSuggestions,
        onGenerate, canGenerate, isLoading, generatedImage, isUpscaling, onUpscale, isOnline,
        upscaleMenuRef, isUpscaleMenuOpen, setIsUpscaleMenuOpen,
    } = props;
    
    const downloadFilename = 'AI-Creative-Shot.png';

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                <ImageUploader title="1. Upload Product Image" description="The main subject of your final image." onImageChange={setProductImage} image={productImage} />
                <ImageUploader title="2. Upload Style Reference (Optional)" description="The AI will match this image's mood and lighting." onImageChange={setReferenceImage} image={referenceImage} />
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-[var(--text-light)] text-lg">
                            3. Add Creative Direction
                        </h3>
                    </div>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g., 'Make it feel more cinematic', 'placed on a marble podium', 'add dramatic morning light'"
                        className="w-full h-24 bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-white placeholder-[var(--text-disabled)] resize-none shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                    />
                    <div className="mt-3 flex justify-center">
                        <button
                            onClick={onGetSuggestions}
                            disabled={!productImage || isGeneratingSuggestions}
                            className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/40 text-indigo-300 hover:text-white hover:bg-[var(--accent-color)]/20 hover:border-[var(--accent-color)]/70 transition-all transform hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] focus:ring-offset-[var(--panel-bg)]"
                            title={!productImage ? "Upload a product image to get suggestions" : "Get creative ideas from the AI"}
                        >
                            {isGeneratingSuggestions ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-t-current border-white/30 rounded-full animate-spin"></div>
                                    <span>Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    <span>Get AI Suggestions</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <AccordionItem title="Export Settings" icon={<ExportIcon className="w-6 h-6 text-[var(--accent-color)]" />} isOpenDefault={false}>
                        <ExportControls settings={exportSettings} setSettings={setExportSettings} />
                    </AccordionItem>
                </div>
            </div>
            
            {/* Generation Controls Footer */}
            <div className="p-3 sm:p-4 flex-shrink-0 mt-auto border-t border-[var(--border-color)]">
                <div className="space-y-3">
                    <button
                        onClick={onGenerate}
                        disabled={!canGenerate}
                        className={`w-full py-3 px-4 text-lg font-bold rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] ${canGenerate
                            ? 'bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white animate-button-glow'
                            : 'bg-gray-700/50 border border-gray-600 text-[var(--text-disabled)] cursor-not-allowed'
                            }`}
                        title={!isOnline ? "You are offline. Please check your connection." : !productImage ? "Upload a product image to start." : !customPrompt.trim() ? "Add a Creative Direction to generate." : "Generate your creative shot"}
                    >
                        {isLoading ? 'AI is Generating...' : 'Generate Image'}
                        {isLoading && <div className="w-6 h-6 border-2 border-t-white border-white/30 rounded-full animate-spin ml-2"></div>}
                    </button>
                    {generatedImage && !isLoading && (
                        <div className="flex gap-3">
                            <a
                                href={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`}
                                download={downloadFilename}
                                className="w-full py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center bg-white/5 text-[var(--text-light)] border border-white/10 hover:bg-white/10 hover:border-white/20"
                            >
                                <DownloadIcon className="h-5 w-5 mr-2" /> Download
                            </a>
                            <div className="relative w-full" ref={upscaleMenuRef}>
                                <button
                                    onClick={() => setIsUpscaleMenuOpen(prev => !prev)}
                                    disabled={!!isUpscaling || isLoading}
                                    className={`w-full py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center border ${!!isUpscaling || isLoading
                                        ? 'bg-gray-700/50 text-[var(--text-disabled)] border-transparent cursor-not-allowed'
                                        : 'bg-white/5 text-[var(--text-light)] border-white/10 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                    title="Enhance image quality"
                                >
                                    {isUpscaling === 'hd' ? 'Upscaling...' : isUpscaling === '4k' ? 'Upscaling...' : 'Upscale'}
                                    {isUpscaling
                                        ? <div className="w-5 h-5 border-2 border-t-white border-white/30 rounded-full animate-spin ml-2"></div>
                                        : <ArrowsExpandIcon className="h-5 w-5 ml-2" />
                                    }
                                </button>
                                {isUpscaleMenuOpen && (
                                    <div className="absolute bottom-full mb-2 w-full bg-[rgba(35,35,35,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-lg z-10 p-1 space-y-1">
                                        <button
                                            onClick={() => onUpscale('hd')}
                                            className="w-full text-left px-3 py-2 text-sm font-semibold text-[var(--text-muted)] rounded-md hover:bg-[var(--accent-color)]/30 hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            HD <span className="text-xs text-[var(--text-disabled)]">(~2K)</span>
                                        </button>
                                        <button
                                            onClick={() => onUpscale('4k')}
                                            className="w-full text-left px-3 py-2 text-sm font-semibold text-[var(--text-muted)] rounded-md hover:bg-[var(--accent-color)]/30 hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            4K <span className="text-xs text-[var(--text-disabled)]">(~4K)</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;

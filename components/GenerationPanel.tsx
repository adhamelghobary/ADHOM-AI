

import React from 'react';
import { ExportSettings, HistoryItem } from '../types';
import { ExportIcon, PhotoIcon, HistoryIcon } from './Icons';
import AccordionItem from './AccordionItem';
import ExportControls from './ExportControls';

interface GenerationPanelProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    negativePrompt: string;
    setNegativePrompt: (prompt: string) => void;
    exportSettings: ExportSettings;
    setExportSettings: (settings: ExportSettings) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isOnline: boolean;
    history: HistoryItem[];
    onLoadHistory: (item: HistoryItem) => void;
    onClearHistory: () => void;
}

const GenerationPanel: React.FC<GenerationPanelProps> = (props) => {
    const {
        prompt, setPrompt, negativePrompt, setNegativePrompt,
        exportSettings, setExportSettings,
        onGenerate, isLoading, isOnline,
        history, onLoadHistory, onClearHistory,
    } = props;

    const canGenerate = prompt.trim() !== '' && !isLoading && isOnline;

    return (
        <div className="bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden h-full">
            <div className="p-3 sm:p-4 border-b border-[var(--border-color)]">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <PhotoIcon className="w-6 h-6 text-[var(--accent-color)]" />
                    Image Generation
                </h2>
            </div>
            <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div>
                    <h3 className="font-semibold text-[var(--text-light)] text-lg mb-2">1. Describe Your Image</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'A photorealistic image of an astronaut riding a horse on Mars, cinematic lighting'"
                        className="w-full h-32 bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-white placeholder-[var(--text-disabled)] resize-none shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                    />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--text-light)] text-lg mb-2">2. Negative Prompt (Optional)</h3>
                    <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="e.g., 'ugly, blurry, text, watermark, bad anatomy, extra limbs'"
                        className="w-full h-24 bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-white placeholder-[var(--text-disabled)] resize-none shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                    />
                </div>
                 <div className="space-y-2">
                    <AccordionItem title="Export Settings" icon={<ExportIcon className="w-6 h-6 text-[var(--accent-color)]" />} isOpenDefault={true}>
                        <ExportControls settings={exportSettings} setSettings={setExportSettings} hideTransparency={true} />
                    </AccordionItem>
                </div>
                 <div className="pt-2">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--text-light)]"><HistoryIcon className="w-6 h-6" /> History</h3>
                        {history.length > 0 && (
                            <button onClick={onClearHistory} className="text-sm font-semibold text-red-400/80 hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10">Clear All</button>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <div className="text-center text-[var(--text-disabled)] py-10">
                            <p className="font-semibold">Your generated images will appear here.</p>
                            <p className="text-sm">Describe an image to get started.</p>
                        </div>
                    ) : (
                        <div className="flex overflow-x-auto gap-4 pb-2">
                            {history.map(item => (
                                (item.generated && item.generated.length > 0) && (
                                    <div 
                                        key={item.id} 
                                        onClick={() => onLoadHistory(item)} 
                                        className="cursor-pointer group flex-shrink-0 text-center relative" 
                                        title={`Prompt: ${item.prompt}\nDate: ${new Date(item.id).toLocaleString()}`}
                                    >
                                        <img 
                                            src={`data:${item.generated[0].mimeType};base64,${item.generated[0].base64}`} 
                                            alt="History thumbnail" 
                                            className="w-32 h-32 object-cover rounded-lg border-2 border-transparent group-hover:border-[var(--accent-color)] transition-all duration-200 transform group-hover:scale-105" 
                                        />
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none">
                                            <p className="text-white text-xs font-semibold text-center line-clamp-4">{item.prompt}</p>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Generation Controls Footer */}
            <div className="p-3 sm:p-4 flex-shrink-0 mt-auto border-t border-[var(--border-color)]">
                 <button
                    onClick={onGenerate}
                    disabled={!canGenerate}
                    className={`w-full py-3 px-4 text-lg font-bold rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] ${canGenerate
                        ? 'bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white animate-button-glow'
                        : 'bg-gray-700/50 border border-gray-600 text-[var(--text-disabled)] cursor-not-allowed'
                        }`}
                    title={!isOnline ? "You are offline. Please check your connection." : !prompt.trim() ? "Add a description to generate." : "Generate your image"}
                >
                    {isLoading ? 'AI is Generating...' : 'Generate Image'}
                    {isLoading && <div className="w-6 h-6 border-2 border-t-white border-white/30 rounded-full animate-spin ml-2"></div>}
                </button>
            </div>
        </div>
    );
};

export default GenerationPanel;
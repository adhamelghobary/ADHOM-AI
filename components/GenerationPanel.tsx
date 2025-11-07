import React from 'react';
import { ExportSettings } from '../types';
import { ExportIcon, PhotoIcon } from './Icons';
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
}

const GenerationPanel: React.FC<GenerationPanelProps> = (props) => {
    const {
        prompt, setPrompt, negativePrompt, setNegativePrompt,
        exportSettings, setExportSettings,
        onGenerate, isLoading, isOnline,
    } = props;

    const canGenerate = prompt.trim() !== '' && !isLoading && isOnline;

    return (
        <div className="bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-[var(--border-color)]">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <PhotoIcon className="w-6 h-6 text-[var(--accent-color)]" />
                    Image Generation
                </h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
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
            </div>

            {/* Generation Controls Footer */}
            <div className="p-4 flex-shrink-0 mt-auto border-t border-[var(--border-color)]">
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

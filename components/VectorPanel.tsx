
import React, { useState } from 'react';
import { ILLUSTRATION_STYLES, DESIGN_KIT_STYLES, DESIGN_COMPONENTS } from '../constants';
import { SparklesIcon, VectorIcon } from './Icons';
import PresetSelector from './PresetSelector';
import { IllustrationStylePreset, DesignStylePreset } from '../types';

interface VectorPanelProps {
    onGenerateIllustration: (prompt: string, style: IllustrationStylePreset, colors: string) => void;
    onGenerateDesignKit: (prompt: string, style: DesignStylePreset, components: string[]) => void;
    onVectorize: () => void;
    isLoading: boolean;
    isVectorizing: boolean;
    hasGeneratedImage: boolean;
    isOnline: boolean;
}

const VectorPanel: React.FC<VectorPanelProps> = ({
    onGenerateIllustration,
    onGenerateDesignKit,
    onVectorize,
    isLoading,
    isVectorizing,
    hasGeneratedImage,
    isOnline
}) => {
    const [activeTab, setActiveTab] = useState<'illustration' | 'design'>('illustration');
    
    // Illustration State
    const [illustrationPrompt, setIllustrationPrompt] = useState('');
    const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStylePreset>(ILLUSTRATION_STYLES[0]);
    const [colors, setColors] = useState('');

    // Design Kit State
    const [designPrompt, setDesignPrompt] = useState('');
    const [designStyle, setDesignStyle] = useState<DesignStylePreset>(DESIGN_KIT_STYLES[0]);
    const [selectedComponents, setSelectedComponents] = useState<string[]>(['buttons', 'typography', 'colors']);

    const toggleComponent = (id: string) => {
        setSelectedComponents(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleGenerate = () => {
        if (activeTab === 'illustration') {
            onGenerateIllustration(illustrationPrompt, illustrationStyle, colors);
        } else {
            onGenerateDesignKit(designPrompt, designStyle, selectedComponents);
        }
    };

    const canGenerate = isOnline && !isLoading && (activeTab === 'illustration' ? !!illustrationPrompt : !!designPrompt);

    return (
        <div className="bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden h-full">
            <div className="p-3 sm:p-4 border-b border-[var(--border-color)] flex-shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <VectorIcon className="w-6 h-6 text-[var(--accent-color)]" />
                    Design & Vector
                </h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-color)]">
                <button 
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'illustration' ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-[var(--text-muted)] hover:text-white'}`}
                    onClick={() => setActiveTab('illustration')}
                >
                    Vector Illustration
                </button>
                <button 
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'design' ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-[var(--text-muted)] hover:text-white'}`}
                    onClick={() => setActiveTab('design')}
                >
                    UI Design Kit
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-6">
                {activeTab === 'illustration' ? (
                    <>
                        <div>
                            <h3 className="font-semibold text-[var(--text-light)] text-sm mb-2">1. Describe Illustration</h3>
                            <textarea
                                value={illustrationPrompt}
                                onChange={(e) => setIllustrationPrompt(e.target.value)}
                                placeholder="e.g., A futuristic city skyline with flying cars, flat style"
                                className="w-full h-24 bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-white placeholder-[var(--text-disabled)] resize-none shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--text-light)] text-sm mb-2">2. Select Style</h3>
                            <PresetSelector 
                                presets={ILLUSTRATION_STYLES} 
                                selectedPresets={[illustrationStyle]} 
                                onSelect={(p) => setIllustrationStyle(p)} 
                            />
                        </div>
                        <div>
                             <h3 className="font-semibold text-[var(--text-light)] text-sm mb-2">3. Color Palette (Optional)</h3>
                             <input
                                type="text"
                                value={colors}
                                onChange={(e) => setColors(e.target.value)}
                                placeholder="e.g., Pastel Pink & Blue, or #FF5733"
                                className="w-full bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-white placeholder-[var(--text-disabled)] shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <h3 className="font-semibold text-[var(--text-light)] text-sm mb-2">1. Project Theme</h3>
                            <textarea
                                value={designPrompt}
                                onChange={(e) => setDesignPrompt(e.target.value)}
                                placeholder="e.g., A meditation app for iOS, peaceful and clean"
                                className="w-full h-24 bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-white placeholder-[var(--text-disabled)] resize-none shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--text-light)] text-sm mb-2">2. Design Style</h3>
                            <PresetSelector 
                                presets={DESIGN_KIT_STYLES} 
                                selectedPresets={[designStyle]} 
                                onSelect={(p) => setDesignStyle(p)} 
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--text-light)] text-sm mb-2">3. Components to Include</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {DESIGN_COMPONENTS.map(comp => (
                                    <label key={comp.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedComponents.includes(comp.id)}
                                            onChange={() => toggleComponent(comp.id)}
                                            className="rounded border-gray-600 text-[var(--accent-color)] focus:ring-[var(--accent-color)] bg-gray-700"
                                        />
                                        <span className="text-xs font-medium text-gray-300">{comp.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="p-3 sm:p-4 flex-shrink-0 mt-auto border-t border-[var(--border-color)] space-y-3">
                <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className={`w-full py-3 px-4 text-lg font-bold rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] ${canGenerate
                        ? 'bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white animate-button-glow'
                        : 'bg-gray-700/50 border border-gray-600 text-[var(--text-disabled)] cursor-not-allowed'
                        }`}
                >
                    {isLoading ? 'Creating Design...' : 'Generate'}
                    {isLoading && <div className="w-6 h-6 border-2 border-t-white border-white/30 rounded-full animate-spin ml-2"></div>}
                </button>

                 {hasGeneratedImage && (
                    <button
                        onClick={onVectorize}
                        disabled={isVectorizing}
                        className={`w-full py-2.5 px-4 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center border ${isVectorizing
                            ? 'bg-gray-700/50 text-[var(--text-disabled)] border-transparent cursor-not-allowed'
                            : 'bg-white/5 text-[var(--accent-color)] border-[var(--accent-color)]/30 hover:bg-[var(--accent-color)]/10'
                            }`}
                    >
                        {isVectorizing ? 'Converting to SVG...' : 'Vectorize (Convert to SVG)'}
                        {isVectorizing ? (
                            <div className="w-4 h-4 border-2 border-t-[var(--accent-color)] border-gray-500 rounded-full animate-spin ml-2"></div>
                        ) : (
                            <VectorIcon className="w-4 h-4 ml-2" />
                        )}
                    </button>
                 )}
            </div>
        </div>
    );
};

export default VectorPanel;


import React from 'react';
import { ImageFile } from '../types';
import { FilmIcon, SparklesIcon } from './Icons';
import ImageUploader from './ImageUploader';
import { DIRECTOR_SHOTS } from '../constants';

interface DirectorPanelProps {
    productImage: ImageFile | null;
    setProductImage: (image: ImageFile | null) => void;
    selectedShotIds: string[];
    setSelectedShotIds: React.Dispatch<React.SetStateAction<string[]>>;
    customPrompt: string;
    setCustomPrompt: (prompt: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isOnline: boolean;
}

const DirectorPanel: React.FC<DirectorPanelProps> = ({
    productImage,
    setProductImage,
    selectedShotIds,
    setSelectedShotIds,
    customPrompt,
    setCustomPrompt,
    onGenerate,
    isLoading,
    isOnline
}) => {

    const toggleShot = (id: string) => {
        setSelectedShotIds(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id) 
                : [...prev, id]
        );
    };

    const angleShots = DIRECTOR_SHOTS.filter(shot => shot.category === 'Angle');
    const environmentShots = DIRECTOR_SHOTS.filter(shot => shot.category === 'Environment');
    
    // Calculate active shots based on selection or custom prompt (if no selection)
    const activeShotCount = selectedShotIds.length > 0 ? selectedShotIds.length : (customPrompt.trim() ? 1 : 0);
    
    const canGenerate = !!productImage && activeShotCount > 0 && !isLoading && isOnline;

    const generateButtonText = isLoading 
        ? 'Directing Scene...' 
        : activeShotCount > 0 
            ? `Generate (${activeShotCount}) Shot${activeShotCount === 1 ? '' : 's'}`
            : 'Generate Shots';

    const renderButtonGrid = (shots: typeof DIRECTOR_SHOTS) => (
        <div className="grid grid-cols-2 gap-2">
            {shots.map(shot => {
                const isSelected = selectedShotIds.includes(shot.id);
                return (
                    <button
                        key={shot.id}
                        onClick={() => toggleShot(shot.id)}
                        className={`p-3 text-sm font-semibold rounded-xl border transition-all duration-200 text-left flex flex-col gap-1 ${
                            isSelected 
                            ? 'bg-[var(--accent-color)] border-transparent text-white shadow-lg shadow-[var(--accent-color)]/20' 
                            : 'bg-white/5 border-transparent text-[var(--text-muted)] hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <span>{shot.label}</span>
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden h-full">
            <div className="p-3 sm:p-4 border-b border-[var(--border-color)] flex-shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <FilmIcon className="w-6 h-6 text-[var(--accent-color)]" />
                    Magic Shot
                </h2>
            </div>

            <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-6">
                <ImageUploader 
                    title="1. Upload Product Image" 
                    description="Your Main Subject" 
                    onImageChange={setProductImage} 
                    image={productImage} 
                />

                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-[var(--text-light)] text-lg">2. Refined Shot Types</h3>
                        <span className="text-xs text-[var(--text-muted)] bg-white/10 px-2 py-1 rounded-full">Select multiple</span>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-[var(--text-disabled)] mb-2 uppercase tracking-wider">Angle Shots</h4>
                            {renderButtonGrid(angleShots)}
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-medium text-[var(--text-disabled)] mb-2 uppercase tracking-wider">Environment & Style</h4>
                            {renderButtonGrid(environmentShots)}
                        </div>
                    </div>
                </div>

                <div>
                     <h3 className="font-semibold text-[var(--text-light)] text-lg mb-2">Custom Style Prompt</h3>
                     <input
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Add a specific direction (optional)..."
                        className="w-full bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-white placeholder-[var(--text-disabled)] shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                    />
                </div>
                
                {/* Placeholder for Future Properties */}
                {/* <div>
                     <h3 className="font-semibold text-[var(--text-light)] text-lg mb-2 opacity-50">Advanced Properties (Coming Soon)</h3>
                </div> */}
            </div>

            <div className="p-3 sm:p-4 flex-shrink-0 mt-auto border-t border-[var(--border-color)]">
                 <button
                    onClick={onGenerate}
                    disabled={!canGenerate}
                    className={`w-full py-3 px-4 text-lg font-bold rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] ${canGenerate
                        ? 'bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white animate-button-glow'
                        : 'bg-gray-700/50 border border-gray-600 text-[var(--text-disabled)] cursor-not-allowed'
                        }`}
                >
                    {generateButtonText}
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-t-white border-white/30 rounded-full animate-spin ml-2"></div>
                    ) : (
                        <SparklesIcon className="w-5 h-5 ml-2" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default DirectorPanel;

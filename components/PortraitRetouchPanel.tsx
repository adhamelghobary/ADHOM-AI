
import React from 'react';
import { ImageFile, AiProfile, AiAnalysisReport } from '../types';
import ImageUploader from './ImageUploader';
import { UserCircleIcon, DownloadIcon, RefreshIcon } from './Icons';

interface PortraitRetouchPanelProps {
    portraitImage: ImageFile | null;
    setPortraitImage: (image: ImageFile | null) => void;
    aiAnalysis: AiAnalysisReport | null;
    isAnalyzing: boolean;
    activeProfile: AiProfile;
    onProfileChange: (profile: AiProfile) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isOnline: boolean;
    retouchedImage: { base64: string; mimeType: string } | null;
    portraitPrompt: string;
    setPortraitPrompt: (prompt: string) => void;
}

const ProfileButton: React.FC<{ title: string; profile: AiProfile; activeProfile: AiProfile; onClick: (profile: AiProfile) => void; }> = ({ title, profile, activeProfile, onClick }) => (
    <button
        onClick={() => onClick(profile)}
        className={`w-full text-center p-2 rounded-lg border-2 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.99] font-semibold
        ${ activeProfile === profile
                ? 'bg-[var(--accent-color)] border-transparent shadow-lg shadow-[var(--accent-color)]/20 text-white'
                : 'bg-white/5 border-transparent hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/10 text-gray-300'
        }`}
    >
        {title}
    </button>
);


const PortraitRetouchPanel: React.FC<PortraitRetouchPanelProps> = (props) => {
    const {
        portraitImage, setPortraitImage, aiAnalysis, isAnalyzing, activeProfile, onProfileChange,
        onGenerate, isLoading, isOnline, retouchedImage, portraitPrompt, setPortraitPrompt
    } = props;

    const canGenerate = !!portraitImage && !isLoading && isOnline && activeProfile !== 'off';

    const handleDownload = () => {
        if (!retouchedImage) return;
        const link = document.createElement('a');
        link.href = `data:${retouchedImage.mimeType};base64,${retouchedImage.base64}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `retouched-portrait-${timestamp}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col h-full">
             <div className="p-3 sm:p-4 border-b border-[var(--border-color)]">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <UserCircleIcon className="w-6 h-6 text-[var(--accent-color)]" />
                    Portrait Retouch
                </h2>
            </div>
            <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
                <ImageUploader
                    title="1. Upload Portrait Image"
                    description="The AI will automatically analyze and enhance it."
                    onImageChange={setPortraitImage}
                    image={portraitImage}
                />

                {portraitImage && (
                    <>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-[var(--text-light)] text-lg flex items-center gap-2">
                                2. AI Subject Analysis
                                {isAnalyzing && <div className="w-4 h-4 border-2 border-t-current border-white/30 rounded-full animate-spin"></div>}
                            </h3>
                            <p className="text-sm text-[var(--text-muted)] -mt-2">The AI's analysis of your image. You can override it below.</p>
                            
                            {isAnalyzing ? (
                                <div className="bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-sm h-[76px] flex items-center justify-center text-[var(--text-muted)]">
                                    Analyzing image...
                                </div>
                            ) : aiAnalysis ? (
                                <div className="bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-sm space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--text-muted)]">Detected Profile:</span>
                                        <span className="font-bold text-[var(--text-light)] capitalize bg-white/10 px-2 py-0.5 rounded">{aiAnalysis.profile} ({aiAnalysis.age_estimation})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Lighting / Focus:</span>
                                        <span className="font-bold text-[var(--text-light)] text-right">{aiAnalysis.lighting_quality} / {aiAnalysis.focus_quality}</span>
                                    </div>
                                    {aiAnalysis.key_observations && aiAnalysis.key_observations.length > 0 && (
                                        <>
                                            <div className="pt-2 border-t border-white/10">
                                                <p className="text-[var(--text-muted)] mb-1 font-semibold">Key Observations:</p>
                                                <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                                    {aiAnalysis.key_observations.map((obs, i) => <li key={i}>{obs}</li>)}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </div>
                        
                        <div className="space-y-3">
                            <h3 className="font-semibold text-[var(--text-light)] text-lg">3. Select AI Profile</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                               <ProfileButton title="Man" profile="male" activeProfile={activeProfile} onClick={onProfileChange} />
                               <ProfileButton title="Woman" profile="female" activeProfile={activeProfile} onClick={onProfileChange} />
                               <ProfileButton title="Child" profile="child" activeProfile={activeProfile} onClick={onProfileChange} />
                               <ProfileButton title="Senior" profile="senior" activeProfile={activeProfile} onClick={onProfileChange} />
                               <ProfileButton title="Pro" profile="professional" activeProfile={activeProfile} onClick={onProfileChange} />
                               <ProfileButton title="Glamour" profile="glamour" activeProfile={activeProfile} onClick={onProfileChange} />
                               <div className="col-span-2">
                                 <ProfileButton title="Off / Manual" profile="off" activeProfile={activeProfile} onClick={onProfileChange} />
                               </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-[var(--text-light)] text-lg">4. Add Custom Instructions (Optional)</h3>
                            <textarea
                                value={portraitPrompt}
                                onChange={(e) => setPortraitPrompt(e.target.value)}
                                placeholder="e.g., 'radiant skin, make eyes sparkle, fix stray hairs'"
                                className="w-full h-24 bg-black/30 border border-[var(--border-color)] rounded-xl p-3 text-white placeholder-[var(--text-disabled)] resize-none shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Generation Controls Footer */}
            <div className="p-3 sm:p-4 flex-shrink-0 mt-auto border-t border-[var(--border-color)]">
                {retouchedImage && !isLoading ? (
                    <div className="flex gap-3">
                        <button
                            onClick={onGenerate}
                            disabled={!canGenerate}
                            className={`w-full py-3 px-4 text-lg font-bold rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] ${
                                canGenerate
                                    ? 'bg-white/10 border border-white/20 text-white'
                                    : 'bg-gray-700/50 border border-gray-600 text-[var(--text-disabled)] cursor-not-allowed'
                            }`}
                            title={!isOnline ? "You are offline." : !portraitImage ? "Upload a portrait to start." : "Apply current settings"}
                        >
                            <RefreshIcon className="w-6 h-6 mr-2" />
                            Apply
                        </button>
                        <button
                            onClick={handleDownload}
                            className="w-full py-3 px-4 text-lg font-bold rounded-lg transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white transform hover:scale-[1.02] active:scale-[0.98] animate-button-glow"
                        >
                            <DownloadIcon className="w-6 h-6 mr-2" />
                            Download
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onGenerate}
                        disabled={!canGenerate}
                        className={`w-full py-3 px-4 text-lg font-bold rounded-lg transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] ${
                            canGenerate
                                ? 'bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white animate-button-glow'
                                : 'bg-gray-700/50 border border-gray-600 text-[var(--text-disabled)] cursor-not-allowed'
                        }`}
                        title={!isOnline ? "You are offline." : !portraitImage ? "Upload a portrait to start." : "Apply current settings"}
                    >
                        {isLoading ? 'AI is Working...' : 'Apply Settings'}
                        {isLoading && <div className="w-6 h-6 border-2 border-t-white border-white/30 rounded-full animate-spin ml-2"></div>}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PortraitRetouchPanel;

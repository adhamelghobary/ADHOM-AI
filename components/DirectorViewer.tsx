
import React, { useState } from 'react';
import { DirectorResult, UpscaleTarget } from '../types';
import { DownloadIcon, CloseIcon, ArrowsExpandIcon } from './Icons';

interface DirectorViewerProps {
    results: DirectorResult[];
    onDelete: (id: string) => void;
    onEnhance: (result: DirectorResult, target: UpscaleTarget) => void;
    isGenerating: boolean;
    isUpscaling: boolean;
}

const DirectorViewer: React.FC<DirectorViewerProps> = ({ results, onDelete, onEnhance, isGenerating, isUpscaling }) => {
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    if (results.length === 0 && !isGenerating) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)]">
                <div className="bg-white/5 p-6 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 opacity-50">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--text-light)]">No Shots Yet</h3>
                <p className="mt-2 max-w-sm text-sm">
                    Upload a product and select shot types in the sidebar to start your photoshoot.
                </p>
            </div>
        );
    }

    const selectedResult = results.find(r => r.id === selectedImageId);

    return (
        <div className="w-full h-full flex flex-col p-2 sm:p-4 lg:p-6 overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-6 flex-shrink-0">3. Generated Results</h2>
            
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-10">
                     {/* Loading Skeleton Card - Shown at the start of the list when generating */}
                    {isGenerating && (
                        <div className="aspect-square rounded-xl bg-[var(--panel-bg)] border border-[var(--border-color)] animate-pulse flex flex-col items-center justify-center overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                            <p className="text-[var(--accent-color)] font-semibold z-10">Developing Shot...</p>
                        </div>
                    )}

                    {results.map((result) => (
                        <div 
                            key={result.id} 
                            onClick={() => setSelectedImageId(result.id)}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--border-color)] bg-black/20 shadow-lg transition-all hover:border-[var(--accent-color)]/50 cursor-zoom-in"
                        >
                            <img 
                                src={`data:${result.image.mimeType};base64,${result.image.base64}`} 
                                alt={result.shotLabel} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            
                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                <div className="flex justify-between w-full">
                                    <span className="inline-block px-2 py-1 bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-md border border-white/10">
                                        {result.shotLabel}
                                    </span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDelete(result.id); }}
                                        className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-110"
                                        title="Delete"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="flex gap-2 justify-center items-center w-full">
                                     <button
                                        onClick={(e) => { e.stopPropagation(); onEnhance(result, 'hd'); }}
                                        disabled={isUpscaling}
                                        className="flex-1 py-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-bold rounded-md border border-white/20 hover:bg-white/20 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                                        title="Enhance Quality"
                                     >
                                        <ArrowsExpandIcon className="w-3 h-3" />
                                        Enhance
                                     </button>

                                    <a 
                                        href={`data:${result.image.mimeType};base64,${result.image.base64}`} 
                                        download={`ADHOM-${result.shotLabel.replace(/\s+/g, '-')}.png`}
                                        className="flex-1 py-1.5 bg-[var(--accent-color)] text-white text-xs font-bold rounded-md hover:bg-indigo-500 transition-colors shadow-lg flex items-center justify-center gap-1"
                                        title="Download"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <DownloadIcon className="w-3 h-3" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedResult && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" 
                    onClick={() => setSelectedImageId(null)}
                    style={{ animation: 'fade-in-scale 0.2s ease-out forwards' }}
                >
                    <button 
                        className="absolute top-4 right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors z-10"
                        onClick={() => setSelectedImageId(null)}
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    
                    <div className="relative max-w-7xl max-h-full w-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                         <img 
                            src={`data:${selectedResult.image.mimeType};base64,${selectedResult.image.base64}`}
                            alt={selectedResult.shotLabel}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                        />
                        
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                             <div className="px-4 py-2 bg-white/10 rounded-full text-sm font-semibold text-white border border-white/10">
                                {selectedResult.shotLabel}
                             </div>
                             
                             <button
                                onClick={() => { setSelectedImageId(null); onEnhance(selectedResult, 'hd'); }}
                                disabled={isUpscaling}
                                className="px-6 py-2.5 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                             >
                                <ArrowsExpandIcon className="w-5 h-5" />
                                {isUpscaling ? 'Enhancing...' : 'Enhance Quality'}
                             </button>

                             <a 
                                href={`data:${selectedResult.image.mimeType};base64,${selectedResult.image.base64}`} 
                                download={`ADHOM-${selectedResult.shotLabel.replace(/\s+/g, '-')}.png`}
                                className="px-6 py-2.5 bg-[var(--accent-color)] text-white font-bold rounded-full hover:bg-indigo-500 transition-colors shadow-lg flex items-center gap-2"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DirectorViewer;

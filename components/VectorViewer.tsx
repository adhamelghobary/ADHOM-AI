
import React, { useState } from 'react';
import { VectorResult } from '../types';
import { DownloadIcon, CodeIcon, CopyIcon, PhotoIcon, VectorIcon } from './Icons';
import Loader from './Loader';

interface VectorViewerProps {
    result: VectorResult | null;
    isGenerating: boolean;
    isVectorizing: boolean;
}

const VectorViewer: React.FC<VectorViewerProps> = ({ result, isGenerating, isVectorizing }) => {
    const [viewMode, setViewMode] = useState<'image' | 'svg' | 'code'>('image');

    const handleDownloadSvg = () => {
        if (!result?.svgCode) return;
        const blob = new Blob([result.svgCode], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vector-export-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadImage = () => {
        if (!result?.rasterImage) return;
        const link = document.createElement('a');
        link.href = `data:${result.rasterImage.mimeType};base64,${result.rasterImage.base64}`;
        link.download = `design-export-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyCode = () => {
        if (result?.svgCode) {
            navigator.clipboard.writeText(result.svgCode);
            alert('SVG Code copied to clipboard!');
        }
    };

    if (isGenerating) {
        return <Loader><p className="mt-4 text-lg font-semibold text-[var(--accent-color)]">Designing your concept...</p></Loader>;
    }

    if (!result) {
        return (
             <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)]">
                <div className="bg-white/5 p-6 rounded-full mb-4">
                    <VectorIcon className="w-12 h-12 opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-light)]">Design Studio</h3>
                <p className="mt-2 max-w-sm text-sm">
                    Generate vector illustrations or UI design kits. <br/> Use "Vectorize" to convert them to real SVG code.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-2 sm:p-4 lg:p-6 overflow-hidden relative">
             {/* Viewer Controls */}
            <div className="absolute top-4 right-4 z-20 flex bg-black/50 backdrop-blur-md rounded-lg p-1 border border-white/10">
                 <button 
                    onClick={() => setViewMode('image')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'image' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="View Raster Image"
                >
                    <PhotoIcon className="w-5 h-5" />
                 </button>
                 {result.svgCode && (
                    <>
                        <button 
                            onClick={() => setViewMode('svg')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'svg' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
                            title="View Rendered SVG"
                        >
                            <VectorIcon className="w-5 h-5" />
                        </button>
                         <button 
                            onClick={() => setViewMode('code')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'code' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
                            title="View SVG Code"
                        >
                            <CodeIcon className="w-5 h-5" />
                        </button>
                    </>
                 )}
            </div>

            <div className="flex-grow flex items-center justify-center relative w-full h-full rounded-xl overflow-hidden bg-[var(--panel-bg)] border border-[var(--border-color)]">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" style={{ backgroundSize: '20px 20px' }}></div>
                
                {viewMode === 'image' && result.rasterImage && (
                     <img 
                        src={`data:${result.rasterImage.mimeType};base64,${result.rasterImage.base64}`} 
                        alt="Raster Result" 
                        className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                )}

                {viewMode === 'svg' && result.svgCode && (
                    <div 
                        className="w-full h-full flex items-center justify-center p-4"
                        dangerouslySetInnerHTML={{ __html: result.svgCode }} 
                    />
                )}

                {viewMode === 'code' && result.svgCode && (
                    <div className="w-full h-full overflow-auto p-4 bg-[#0d1117] text-left">
                         <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all">
                            {result.svgCode}
                         </pre>
                    </div>
                )}

                {isVectorizing && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                         <div className="w-12 h-12 border-4 border-t-[var(--accent-color)] border-gray-600 rounded-full animate-spin mb-4"></div>
                         <p className="text-white font-semibold">Converting to Vector Path Data...</p>
                         <p className="text-xs text-gray-400 mt-2">This involves complex mathematical reconstruction.</p>
                    </div>
                )}
            </div>
            
            {/* Action Footer */}
            <div className="flex justify-end gap-3 mt-4">
                {viewMode === 'code' && (
                     <button 
                        onClick={handleCopyCode}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                        <CopyIcon className="w-4 h-4" /> Copy Code
                    </button>
                )}
                {result.svgCode && (viewMode === 'svg' || viewMode === 'code') ? (
                    <button 
                        onClick={handleDownloadSvg}
                        className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2 text-sm font-bold shadow-lg"
                    >
                        <DownloadIcon className="w-4 h-4" /> Download SVG
                    </button>
                ) : (
                     <button 
                        onClick={handleDownloadImage}
                        className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2 text-sm font-bold shadow-lg"
                    >
                        <DownloadIcon className="w-4 h-4" /> Download Image
                    </button>
                )}
            </div>
        </div>
    );
};

export default VectorViewer;

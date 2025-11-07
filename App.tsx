import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    ImageFile, CameraPreset, LightingPreset, MockupPreset, ManipulationPreset, RetouchPreset, PeopleRetouchPreset, 
    ExportSettings, UpscaleTarget, HistoryItem, ChosenSettings, SuggestionConcept
} from './types';
import { 
    CAMERA_PRESETS, LIGHTING_PRESETS, MOCKUP_PRESETS, MANIPULATION_PRESETS, 
    RETOUCH_PRESETS, PEOPLE_RETOUCH_PRESETS
} from './constants';
import ControlPanel from './components/ControlPanel';
import GenerationPanel from './components/GenerationPanel';
import ImageViewer from './components/ImageViewer';
import FineTunePanel from './components/FineTunePanel';
import { BehanceIcon, FacebookIcon, InstagramIcon, WhatsAppIcon, HistoryIcon, CloseIcon, SparklesIcon, LogoIcon } from './components/Icons';
import { 
    generateFinalImage,
    upscaleImage, 
    generateCreativeSuggestions,
    generateImageWithImagen
} from './services/geminiService';


interface SuggestionsModalProps {
    isOpen: boolean;
    suggestions: SuggestionConcept[];
    onSelect: (suggestion: SuggestionConcept) => void;
    onClose: () => void;
}

const SuggestionsModal: React.FC<SuggestionsModalProps> = ({ isOpen, suggestions, onSelect, onClose }) => {
    if (!isOpen) return null;

    const handleSelect = (suggestion: SuggestionConcept) => {
        onSelect(suggestion);
    };
    
    const getPresetByName = (category: 'Camera' | 'Lighting' | 'Mockup', name: string) => {
        if (!name || name === "None") return null;
        const presets = {
            'Camera': CAMERA_PRESETS,
            'Lighting': LIGHTING_PRESETS,
            'Mockup': MOCKUP_PRESETS,
        }[category];
        return presets.find(p => p.name === name);
    }

    const renderSettingTag = (category: 'Camera' | 'Lighting' | 'Mockup', settingName: string | undefined) => {
        if (!settingName || settingName === "None") return null;
        
        const displayName = category === 'Lighting' ? settingName.split(',')[0].trim() : settingName;
        const preset = getPresetByName(category, displayName);

        if (!preset) return null;

        return (
            <div className="flex items-center gap-1.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-semibold px-2 py-1 rounded-full border border-[var(--accent-color)]/20">
                {React.cloneElement(preset.icon, { className: "w-4 h-4" })}
                <span>{displayName}</span>
            </div>
        )
    }


    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    role="dialog"
                    aria-modal="true"
                    className="w-full max-w-4xl bg-[rgba(16,18,27,0.7)] backdrop-blur-[30px] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl transform transition-all"
                    style={{ animation: 'fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                >
                    <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.05)]">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <SparklesIcon className="w-6 h-6 text-[var(--accent-color)]" />
                            AI Creative Suggestions
                        </h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <p className="text-sm text-[var(--text-muted)] mb-4">Based on your product, here are a few creative directions to start with. Click one to apply it.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(suggestion)}
                                    className="w-full text-left p-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/10 transition-all transform hover:scale-[1.02] flex flex-col gap-3"
                                >
                                    <h3 className="font-bold text-lg text-white">{suggestion.concept_title || `Concept ${index + 1}`}</h3>
                                    <p className="text-sm text-[var(--text-muted)] flex-grow">{suggestion.prompt_text}</p>
                                    <div className="flex flex-wrap items-center gap-2 pt-2 mt-auto border-t border-white/5">
                                        {renderSettingTag('Camera', suggestion.settings_json.Camera)}
                                        {renderSettingTag('Lighting', suggestion.settings_json.Lighting)}
                                        {renderSettingTag('Mockup', suggestion.settings_json.Mockup)}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 text-center">
                            <button onClick={onClose} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                                Or, continue with my own prompt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


const App: React.FC = () => {
    // Mode
    const [mode, setMode] = useState<'studio' | 'generate'>('studio');

    // Shared Image states
    const [generatedImage, setGeneratedImage] = useState<{ base64: string; mimeType: string } | null>(null);

    // Studio Mode states
    const [productImage, setProductImage] = useState<ImageFile | null>(null);
    const [referenceImage, setReferenceImage] = useState<ImageFile | null>(null);
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [selectedCameras, setSelectedCameras] = useState<CameraPreset[]>([CAMERA_PRESETS[0]]);
    const [selectedLightings, setSelectedLightings] = useState<LightingPreset[]>([LIGHTING_PRESETS[0]]);
    const [selectedMockups, setSelectedMockups] = useState<MockupPreset[]>([MOCKUP_PRESETS[0]]);
    const [selectedManipulations, setSelectedManipulations] = useState<ManipulationPreset[]>([MANIPULATION_PRESETS[0]]);
    const [selectedPeopleRetouches, setSelectedPeopleRetouches] = useState<PeopleRetouchPreset[]>([PEOPLE_RETOUCH_PRESETS[0]]);
    const [selectedRetouches, setSelectedRetouches] = useState<RetouchPreset[]>([RETOUCH_PRESETS[0]]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false);
    const [creativeSuggestions, setCreativeSuggestions] = useState<SuggestionConcept[]>([]);
    const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState<boolean>(false);

    // Generation Mode states
    const [generationPrompt, setGenerationPrompt] = useState<string>('');
    const [negativePrompt, setNegativePrompt] = useState<string>('');

    // Shared states
    const [exportSettings, setExportSettings] = useState<ExportSettings>({ aspectRatio: '1:1', transparent: false });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isUpscaling, setIsUpscaling] = useState<false | UpscaleTarget>(false);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [isUpscaleMenuOpen, setIsUpscaleMenuOpen] = useState<boolean>(false);
    
    // Data
    const [history, setHistory] = useState<HistoryItem[]>([]);
    
    // Refs
    const upscaleMenuRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleGetSuggestions = async () => {
        if (!productImage) return;
        setIsGeneratingSuggestions(true);
        setCreativeSuggestions([]);
        try {
            const suggestions = await generateCreativeSuggestions(productImage, referenceImage, customPrompt);
            if (suggestions && suggestions.length > 0) {
                setCreativeSuggestions(suggestions);
                setIsSuggestionsModalOpen(true);
            }
        } catch (error) {
            console.error("Failed to generate creative suggestions:", error);
            alert(`Could not get AI suggestions: ${(error as Error).message}`);
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };
    
    const handlePresetSelect = useCallback((preset: any, state: any[], setState: React.Dispatch<React.SetStateAction<any[]>>, allPresets: readonly any[], singleSelect = false) => {
        setState(prevSelected => {
            if (singleSelect) return [preset];
            const isNone = preset.id === 'none';
            const nonePreset = allPresets[0];
            if (isNone) return [nonePreset];
            const newSelection = prevSelected.filter(p => p.id !== 'none' && p.id !== preset.id);
            if (!prevSelected.some(p => p.id === preset.id)) newSelection.push(preset);
            return newSelection.length > 0 ? newSelection : [nonePreset];
        });
    }, []);

    const updateControlsFromSettings = useCallback((settings: Partial<ChosenSettings>) => {
        const findAndSet = (key: keyof ChosenSettings, allPresets: readonly any[], setter: React.Dispatch<React.SetStateAction<any[]>>, isMultiSelect: boolean) => {
            const settingValue = settings[key];
            if (typeof settingValue !== 'string' || !settingValue || settingValue.toLowerCase() === 'none') {
                setter([allPresets[0]]);
                return;
            }
            const namesToFind = isMultiSelect ? settingValue.split(',').map(name => name.trim()) : [settingValue.trim()];
            const presets = namesToFind.map(name => allPresets.find(p => p.name === name)).filter((p): p is any => !!p);
            if (presets.length > 0) setter(presets); else setter([allPresets[0]]);
        };
        findAndSet('Camera', CAMERA_PRESETS, setSelectedCameras, false);
        findAndSet('Lighting', LIGHTING_PRESETS, setSelectedLightings, true);
        findAndSet('Mockup', MOCKUP_PRESETS, setSelectedMockups, false);
        findAndSet('Manipulation', MANIPULATION_PRESETS, setSelectedManipulations, true);
        findAndSet('Product Retouch', RETOUCH_PRESETS, setSelectedRetouches, true);
        findAndSet('People Retouch', PEOPLE_RETOUCH_PRESETS, setSelectedPeopleRetouches, true);
    }, []);
    
    const canGenerateStudio = !!productImage && customPrompt.trim() !== '' && !isLoading && isOnline;

    const handleGenerateStudio = useCallback(async () => {
        if (!canGenerateStudio || !productImage) return;
        setIsLoading(true);
        setGeneratedImage(null);
        setGenerationPrompt('');
        setNegativePrompt('');
        
        const finalSettings: ChosenSettings = {
            Camera: selectedCameras[0].name,
            Lighting: selectedLightings.map(p => p.name).filter(n => n !== 'None').join(', ') || 'None',
            Mockup: selectedMockups[0].name,
            Manipulation: selectedManipulations.map(p => p.name).filter(n => n !== 'None').join(', ') || 'None',
            'Product Retouch': selectedRetouches.map(p => p.name).filter(n => n !== 'None').join(', ') || 'None',
            'People Retouch': selectedPeopleRetouches.map(p => p.name).filter(n => n !== 'None').join(', ') || 'None',
        };

        try {
            const generatedImageResult = await generateFinalImage(productImage, referenceImage, customPrompt, finalSettings, exportSettings);
            if (generatedImageResult) {
                setGeneratedImage(generatedImageResult);
                const historyEntry: HistoryItem = {
                    id: new Date().toISOString(), generated: generatedImageResult, source: productImage,
                    referenceImage: referenceImage, prompt: customPrompt, chosenSettings: finalSettings, exportSettings: exportSettings,
                };
                setHistory(prev => [historyEntry, ...prev]);
            }
        } catch (error) {
            console.error("Generation error:", error);
            alert(`An error occurred during generation: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }, [canGenerateStudio, productImage, referenceImage, customPrompt, exportSettings, selectedCameras, selectedLightings, selectedMockups, selectedManipulations, selectedRetouches, selectedPeopleRetouches]);

    const handleImageGeneration = async () => {
        if (generationPrompt.trim() === '' || isLoading || !isOnline) return;
        setIsLoading(true);
        setGeneratedImage(null);
        setProductImage(null);
        setReferenceImage(null);
        setCustomPrompt('');
        
        try {
            const result = await generateImageWithImagen(generationPrompt, negativePrompt, exportSettings);
            if (result) {
                setGeneratedImage(result);
                const historyEntry: HistoryItem = {
                    id: new Date().toISOString(), generated: result, source: null, referenceImage: null,
                    prompt: generationPrompt, negativePrompt: negativePrompt, exportSettings: exportSettings,
                };
                setHistory(prev => [historyEntry, ...prev]);
            }
        } catch (error) {
            console.error("Image generation error:", error);
            alert(`An error occurred during image generation: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpscale = useCallback(async (target: UpscaleTarget) => {
        if (!generatedImage || isUpscaling) return;
        setIsUpscaleMenuOpen(false);
        setIsUpscaling(target);
        try {
            const result = await upscaleImage(generatedImage, target);
            if (result) {
                setGeneratedImage(result);
                 const historyEntry: HistoryItem = {
                    id: new Date().toISOString() + '-upscaled', generated: result, source: productImage,
                    prompt: `Upscaled to ${target.toUpperCase()}`, referenceImage, exportSettings
                };
                setHistory(prev => [historyEntry, ...prev]);
            } else { alert("Upscale failed: No image was returned by the AI."); }
        } catch (error) {
            console.error("Upscale error:", error);
            alert(`An error occurred during upscaling: ${(error as Error).message}`);
        } finally { setIsUpscaling(false); }
    }, [generatedImage, isUpscaling, productImage, referenceImage, exportSettings]);
    
    const resetStudioControls = useCallback(() => {
        setSelectedCameras([CAMERA_PRESETS[0]]);
        setSelectedLightings([LIGHTING_PRESETS[0]]);
        setSelectedMockups([MOCKUP_PRESETS[0]]);
        setSelectedManipulations([MANIPULATION_PRESETS[0]]);
        setSelectedPeopleRetouches([PEOPLE_RETOUCH_PRESETS[0]]);
        setSelectedRetouches([RETOUCH_PRESETS[0]]);
    }, []);

    const loadFromHistory = (item: HistoryItem) => {
        setGeneratedImage(item.generated);
        setExportSettings(item.exportSettings || { aspectRatio: '1:1', transparent: false });

        if (item.source) { // Studio item
            setMode('studio');
            setProductImage(item.source);
            setReferenceImage(item.referenceImage || null);
            setCustomPrompt(item.prompt || '');
            if (item.chosenSettings) {
                updateControlsFromSettings(item.chosenSettings);
            }
            setGenerationPrompt('');
            setNegativePrompt('');
        } else { // Generation item
            setMode('generate');
            setGenerationPrompt(item.prompt || '');
            setNegativePrompt(item.negativePrompt || '');
            setProductImage(null);
            setReferenceImage(null);
            setCustomPrompt('');
            resetStudioControls();
        }
    };

    const handleSuggestionSelect = (suggestion: SuggestionConcept) => {
        setCustomPrompt(suggestion.prompt_text);
        updateControlsFromSettings(suggestion.settings_json);
        setIsSuggestionsModalOpen(false);
    };

    return (
        <div className="min-h-screen lg:h-screen flex flex-col">
            <header className="flex-shrink-0 p-4 flex justify-between items-center bg-black/30 backdrop-blur-xl border-b border-[var(--border-color)] z-20">
                <a href="#" className="flex items-center gap-3 group">
                    <LogoIcon className="w-8 h-8 text-[var(--accent-color)] transition-transform duration-300 ease-in-out group-hover:rotate-[15deg] group-hover:scale-110" />
                    <h1 className="text-2xl font-bold from-slate-200 to-slate-400 bg-gradient-to-r bg-clip-text text-transparent tracking-wide">
                        ADHOM AI <span className="font-light">Creative Studio</span>
                    </h1>
                </a>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 p-1 bg-black/20 rounded-full border border-[var(--border-color)]">
                    <button onClick={() => setMode('studio')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${mode === 'studio' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                        Creative Studio
                    </button>
                    <button onClick={() => setMode('generate')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${mode === 'generate' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                        Image Generation
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <span className="mr-2">Follow:</span>
                        <a href="#" className="p-2 rounded-full hover:bg-white/10 transform transition-all duration-200 hover:scale-110 hover:text-white" title="Instagram"><InstagramIcon className="w-5 h-5" /></a>
                        <a href="#" className="p-2 rounded-full hover:bg-white/10 transform transition-all duration-200 hover:scale-110 hover:text-white" title="Facebook"><FacebookIcon className="w-5 h-5" /></a>
                        <a href="#" className="p-2 rounded-full hover:bg-white/10 transform transition-all duration-200 hover:scale-110 hover:text-white" title="Behance"><BehanceIcon className="w-5 h-5" /></a>
                        <a href="#" className="p-2 rounded-full hover:bg-white/10 transform transition-all duration-200 hover:scale-110 hover:text-white" title="WhatsApp"><WhatsAppIcon className="w-5 h-5" /></a>
                    </div>
                </div>
            </header>

            <main className={`flex-grow grid ${mode === 'studio' ? 'grid-cols-1 lg:grid-cols-[520px_1fr_420px]' : 'grid-cols-1 lg:grid-cols-[520px_1fr]'} lg:min-h-0 p-4 gap-4 pb-28 lg:pb-4`}>
                {mode === 'studio' ? (
                    <>
                        <aside className="w-full lg:col-span-1 flex-shrink-0 bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden lg:min-h-0">
                            <ControlPanel
                                exportSettings={exportSettings} setExportSettings={setExportSettings}
                                productImage={productImage} setProductImage={setProductImage}
                                referenceImage={referenceImage} setReferenceImage={setReferenceImage}
                                customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
                                onGetSuggestions={handleGetSuggestions} isGeneratingSuggestions={isGeneratingSuggestions}
                                onGenerate={handleGenerateStudio} canGenerate={canGenerateStudio} isLoading={isLoading} generatedImage={generatedImage}
                                isUpscaling={isUpscaling} onUpscale={handleUpscale} isOnline={isOnline}
                                upscaleMenuRef={upscaleMenuRef} isUpscaleMenuOpen={isUpscaleMenuOpen} setIsUpscaleMenuOpen={setIsUpscaleMenuOpen}
                            />
                        </aside>
                        <section className="relative flex-grow flex items-center justify-center h-full animated-viewer-bg rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" style={{ backgroundSize: '30px 30px' }}></div>
                             <ImageViewer productImage={productImage} generatedImage={generatedImage} isGenerating={isLoading} aspectRatio={exportSettings.aspectRatio}/>
                        </section>
                        <aside className="w-full lg:col-span-1 lg:min-h-0 flex flex-col gap-4">
                            <FineTunePanel
                                selectedCameras={selectedCameras} onCameraSelect={(p) => handlePresetSelect(p, selectedCameras, setSelectedCameras, CAMERA_PRESETS, true)}
                                selectedLightings={selectedLightings} onLightingSelect={(p) => handlePresetSelect(p, selectedLightings, setSelectedLightings, LIGHTING_PRESETS)}
                                selectedMockups={selectedMockups} onMockupSelect={(p) => handlePresetSelect(p, selectedMockups, setSelectedMockups, MOCKUP_PRESETS, true)}
                                selectedManipulations={selectedManipulations} onManipulationSelect={(p) => handlePresetSelect(p, selectedManipulations, setSelectedManipulations, MANIPULATION_PRESETS)}
                                selectedPeopleRetouches={selectedPeopleRetouches} onPeopleRetouchSelect={(p) => handlePresetSelect(p, selectedPeopleRetouches, setSelectedPeopleRetouches, PEOPLE_RETOUCH_PRESETS)}
                                selectedRetouches={selectedRetouches} onRetouchSelect={(p) => handlePresetSelect(p, selectedRetouches, setSelectedRetouches, RETOUCH_PRESETS)}
                            />
                            <div className="flex-shrink-0 bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl">
                                <div className="p-4"><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-lg flex items-center gap-2 text-[var(--text-light)]"><HistoryIcon className="w-6 h-6" /> History</h3>
                                        {history.length > 0 && (<button onClick={() => setHistory([])} className="text-sm font-semibold text-red-400/80 hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10">Clear All</button>)}
                                    </div>
                                    {history.length === 0 ? (<div className="text-center text-[var(--text-disabled)] py-10"><p className="font-semibold">Your generations will appear here.</p><p className="text-sm">Start a new project to see your creative history.</p></div>
                                    ) : ( <div className="flex overflow-x-auto gap-4 pb-2"> {history.map(item => ( <div key={item.id} onClick={() => loadFromHistory(item)} className="cursor-pointer group flex-shrink-0 text-center relative" title={`Prompt: ${item.prompt}\nDate: ${new Date(item.id.split('-upscaled')[0]).toLocaleString()}`}><img src={`data:${item.generated.mimeType};base64,${item.generated.base64}`} alt="History thumbnail" className="w-32 h-32 object-cover rounded-lg border-2 border-transparent group-hover:border-[var(--accent-color)] transition-all duration-200 transform group-hover:scale-105" /> <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"><p className="text-white text-xs font-semibold text-center line-clamp-4">{item.prompt}</p></div> </div>))}</div>)}
                                </div>
                            </div>
                        </aside>
                    </>
                ) : (
                    <>
                        <aside className="w-full lg:col-span-1 flex-shrink-0 h-full">
                           <GenerationPanel
                                prompt={generationPrompt} setPrompt={setGenerationPrompt}
                                negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt}
                                exportSettings={exportSettings} setExportSettings={setExportSettings}
                                onGenerate={handleImageGeneration}
                                isLoading={isLoading}
                                isOnline={isOnline}
                           />
                        </aside>
                        <section className="relative flex-grow flex items-center justify-center h-full animated-viewer-bg rounded-2xl overflow-hidden lg:col-span-1">
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" style={{ backgroundSize: '30px 30px' }}></div>
                             <ImageViewer productImage={null} generatedImage={generatedImage} isGenerating={isLoading} aspectRatio={exportSettings.aspectRatio}/>
                        </section>
                    </>
                )}

                 <SuggestionsModal isOpen={isSuggestionsModalOpen} suggestions={creativeSuggestions} onSelect={handleSuggestionSelect} onClose={() => setIsSuggestionsModalOpen(false)} />
            </main>
        </div>
    );
};

export default App;
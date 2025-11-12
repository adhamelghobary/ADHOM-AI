
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    ImageFile, CameraPreset, LightingPreset, MockupPreset, ManipulationPreset, RetouchPreset, PeopleRetouchPreset, 
    ExportSettings, UpscaleTarget, HistoryItem, ChosenSettings, SuggestionConcept,
    PortraitRetouchSettings, AiProfile, AiAnalysisReport,
    CameraSettings, LightingSettings
} from './types';
import { 
    CAMERA_PRESETS, LIGHTING_PRESETS, MOCKUP_PRESETS, MANIPULATION_PRESETS, 
    RETOUCH_PRESETS, PEOPLE_RETOUCH_PRESETS, DEFAULT_PORTRAIT_SETTINGS
} from './constants';
import ControlPanel from './components/ControlPanel';
import GenerationPanel from './components/GenerationPanel';
import ImageViewer from './components/ImageViewer';
import FineTunePanel from './components/FineTunePanel';
import PortraitRetouchPanel from './components/PortraitRetouchPanel';
import PortraitTunePanel from './components/PortraitTunePanel';
import BottomNavBar from './components/BottomNavBar';
import { BehanceIcon, FacebookIcon, InstagramIcon, WhatsAppIcon, HistoryIcon, CloseIcon, SparklesIcon, LogoIcon } from './components/Icons';
import { 
    generateFinalImage,
    upscaleImage, 
    generateCreativeSuggestions,
    generateImageWithImagen,
    analyzePortraitSubject,
    retouchPortraitImage,
    generateCameraSuggestions
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
    
    const getPresetByName = (category: 'Camera' | 'Lighting' | 'Mockup' | 'Manipulation' | 'Product Retouch' | 'People Retouch', name: string) => {
        if (!name || name === "None") return null;
        const presets = {
            'Camera': CAMERA_PRESETS,
            'Lighting': LIGHTING_PRESETS,
            'Mockup': MOCKUP_PRESETS,
            'Manipulation': MANIPULATION_PRESETS,
            'Product Retouch': RETOUCH_PRESETS,
            'People Retouch': PEOPLE_RETOUCH_PRESETS,
        }[category];
        return (presets as any[]).find(p => p.name === name);
    }

    const renderSettingTag = (category: 'Camera' | 'Lighting' | 'Mockup' | 'Manipulation' | 'Product Retouch' | 'People Retouch', settingName: string | undefined) => {
        if (!settingName || settingName === "None" || settingName.trim() === '') return null;
        
        const presetNames = settingName.split(',').map(name => name.trim());
        
        return presetNames.map(name => {
            const preset = getPresetByName(category, name);
            if (!preset) return null;
            
            return (
                <div key={`${category}-${preset.id}`} className="flex items-center gap-1.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-semibold px-2 py-1 rounded-full border border-[var(--accent-color)]/20">
                    {React.cloneElement(preset.icon, { className: "w-4 h-4" })}
                    <span>{name}</span>
                </div>
            )
        }).filter(Boolean);
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
                                        {renderSettingTag('Manipulation', suggestion.settings_json.Manipulation)}
                                        {renderSettingTag('Product Retouch', suggestion.settings_json['Product Retouch'])}
                                        {renderSettingTag('People Retouch', suggestion.settings_json['People Retouch'])}
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
    const [mode, setMode] = useState<'studio' | 'generate' | 'portrait'>('studio');

    // Image states
    const [studioGeneratedImage, setStudioGeneratedImage] = useState<{ base64: string; mimeType: string } | null>(null);
    const [generationGeneratedImages, setGenerationGeneratedImages] = useState<Array<{ base64: string; mimeType: string }> | null>(null);

    // --- Studio Mode states ---
    const [productImage, setProductImage] = useState<ImageFile | null>(null);
    const [referenceImage, setReferenceImage] = useState<ImageFile | null>(null);
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false);
    const [creativeSuggestions, setCreativeSuggestions] = useState<SuggestionConcept[]>([]);
    const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState<boolean>(false);

    // Fine-Tune States
    const [selectedCameras, setSelectedCameras] = useState<CameraPreset[]>([CAMERA_PRESETS[0]]);
    const [selectedLightings, setSelectedLightings] = useState<LightingPreset[]>([LIGHTING_PRESETS[0]]);
    const [selectedMockups, setSelectedMockups] = useState<MockupPreset[]>([MOCKUP_PRESETS[0]]);
    const [selectedManipulations, setSelectedManipulations] = useState<ManipulationPreset[]>([MANIPULATION_PRESETS[0]]);
    const [selectedPeopleRetouches, setSelectedPeopleRetouches] = useState<PeopleRetouchPreset[]>([PEOPLE_RETOUCH_PRESETS[0]]);
    const [selectedRetouches, setSelectedRetouches] = useState<RetouchPreset[]>([RETOUCH_PRESETS[0]]);
    const [cameraSuggestions, setCameraSuggestions] = useState<string[]>([]);
    const [isGeneratingCameraSuggestions, setIsGeneratingCameraSuggestions] = useState<boolean>(false);

    // Detailed Settings States
    const DEFAULT_CAMERA_SETTINGS: CameraSettings = { focalLength: 50, aperture: 5.6, shutterSpeed: 125, height: 15, pitch: 0, roll: 0 };
    const DEFAULT_LIGHTING_SETTINGS: LightingSettings = { temperature: 5500, intensity: 80, hardness: 25 };
    const [cameraSettings, setCameraSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
    const [lightingSettings, setLightingSettings] = useState<LightingSettings>(DEFAULT_LIGHTING_SETTINGS);

    // Generation Mode states
    const [generationPrompt, setGenerationPrompt] = useState<string>('');
    const [negativePrompt, setNegativePrompt] = useState<string>('');
    
    // Portrait Retouch Mode states
    const [portraitImage, setPortraitImage] = useState<ImageFile | null>(null);
    const [retouchedImage, setRetouchedImage] = useState<{ base64: string; mimeType: string } | null>(null);
    const [portraitPrompt, setPortraitPrompt] = useState<string>('');
    const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisReport | null>(null);
    const [isAnalyzingPortrait, setIsAnalyzingPortrait] = useState<boolean>(false);
    const [aiProfile, setAiProfile] = useState<AiProfile>('off');
    
    const [portraitSettings, setPortraitSettings] = useState<PortraitRetouchSettings>(DEFAULT_PORTRAIT_SETTINGS.off);

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

    // --- Derived State for History ---
    const studioHistory = history.filter(item => !!item.source);
    const generationHistory = history.filter(item => !item.source);

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

    // This effect handles closing the upscale menu when clicking outside of it.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (upscaleMenuRef.current && !upscaleMenuRef.current.contains(event.target as Node)) {
                setIsUpscaleMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [upscaleMenuRef]);
    
    const handleGenerateRetouch = useCallback(async (profile: AiProfile, settings: PortraitRetouchSettings, prompt: string) => {
        if (!portraitImage || !isOnline) return;
        setIsLoading(true);
        setRetouchedImage(null);
        try {
            const result = await retouchPortraitImage(portraitImage, profile, settings, prompt);
            if (result) {
                setRetouchedImage(result);
            } else {
                alert("Retouching failed: The AI did not return an image.");
            }
        } catch (error) {
            console.error("Portrait retouch error:", error);
            alert(`An error occurred during retouching: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }, [portraitImage, isOnline]);
    
    useEffect(() => {
        const performAnalysisAndAutoRetouch = async () => {
            if (portraitImage) {
                setIsAnalyzingPortrait(true);
                setAiAnalysis(null);
                setRetouchedImage(null);
                setAiProfile('off');
                setPortraitPrompt('');
                try {
                    const analysisResult = await analyzePortraitSubject(portraitImage);
                    setAiAnalysis(analysisResult);
                    
                    const detectedProfile = analysisResult.profile;
                    let newProfile: AiProfile = 'off';

                    if (detectedProfile === 'male' || detectedProfile === 'female' || detectedProfile === 'child' || detectedProfile === 'senior') {
                        newProfile = detectedProfile;
                    }
                    setAiProfile(newProfile);

                    if (newProfile !== 'off') {
                        const newSettings = DEFAULT_PORTRAIT_SETTINGS[newProfile];
                        setPortraitSettings(newSettings);
                        await handleGenerateRetouch(newProfile, newSettings, '');
                    }
                } catch(e) {
                    console.error("AI Analysis failed", e);
                    setAiAnalysis({ profile: 'off', age_estimation: 'N/A', lighting_quality: 'Unknown', focus_quality: 'Unknown', key_observations: ['AI analysis failed.'] });
                } finally {
                    setIsAnalyzingPortrait(false);
                }
            } else {
                setAiAnalysis(null);
                setRetouchedImage(null);
                setAiProfile('off');
                setPortraitPrompt('');
            }
        };
        performAnalysisAndAutoRetouch();
    }, [portraitImage, handleGenerateRetouch]);
    
    useEffect(() => {
        if (portraitImage) { // Only change settings if there's an image
            setPortraitSettings(DEFAULT_PORTRAIT_SETTINGS[aiProfile]);
            if (aiProfile === 'off') {
                setRetouchedImage(null);
            }
        }
    }, [aiProfile, portraitImage]);

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
    
    const parseMetadata = (metadata: string, type: 'camera' | 'lighting') => {
        const getAvg = (match: RegExpMatchArray | null) => match ? (parseInt(match[1]) + parseInt(match[2])) / 2 : null;
        const getVal = (match: RegExpMatchArray | null) => match ? parseFloat(match[1]) : null;

        if (type === 'camera') {
            const newSettings = { ...DEFAULT_CAMERA_SETTINGS };
            if (metadata.includes('eye-level')) newSettings.height = 15;
            
            newSettings.focalLength = getAvg(metadata.match(/(\d+)–(\d+)mm/)) ?? getVal(metadata.match(/(\d+)mm/)) ?? newSettings.focalLength;
            newSettings.aperture = getAvg(metadata.match(/aperture (\d+\.\d+)-(\d+\.\d+)/)) ?? getVal(metadata.match(/aperture (\d+\.\d+)/)) ?? newSettings.aperture;
            newSettings.shutterSpeed = getVal(metadata.match(/shutter (\d+)/)) ?? newSettings.shutterSpeed;
            newSettings.height = getAvg(metadata.match(/height (\d+)–(\d+)cm/)) ?? getVal(metadata.match(/height (\d+)cm/)) ?? newSettings.height;
            newSettings.pitch = getVal(metadata.match(/pitch ([+-]?\d+)/)) ?? newSettings.pitch;
            newSettings.roll = getVal(metadata.match(/roll ([+-]?\d+)/)) ?? newSettings.roll;
            setCameraSettings(newSettings);
        } else { // lighting
             const newSettings = { ...DEFAULT_LIGHTING_SETTINGS };
             newSettings.temperature = getVal(metadata.match(/temp (\d+)K/)) ?? newSettings.temperature;
             newSettings.intensity = getVal(metadata.match(/intensity (\d+)%/)) ?? newSettings.intensity;
             newSettings.hardness = getVal(metadata.match(/hardness (\d+)%/)) ?? newSettings.hardness;
             setLightingSettings(newSettings);
        }
    };
    
    const handleCameraSelect = async (preset: CameraPreset) => {
        setSelectedCameras([preset]);
        if (preset.id === 'none') {
            setCameraSettings(DEFAULT_CAMERA_SETTINGS);
        } else {
            parseMetadata(preset.metadata, 'camera');
        }

        if (preset.id === 'none' && productImage && customPrompt) {
            setIsGeneratingCameraSuggestions(true);
            setCameraSuggestions([]);
            try {
                const suggestions = await generateCameraSuggestions(productImage, customPrompt);
                setCameraSuggestions(suggestions);
            } catch (error) {
                console.error('Failed to get camera suggestions', error);
                alert('Could not fetch AI camera suggestions.');
            } finally {
                setIsGeneratingCameraSuggestions(false);
            }
        } else if (preset.id !== 'none') {
            setCameraSuggestions([]);
        }
    };
    
    const handleLightingSelect = (preset: LightingPreset) => {
        handlePresetSelect(preset, selectedLightings, setSelectedLightings, LIGHTING_PRESETS);
        if (preset.id === 'none') {
            setLightingSettings(DEFAULT_LIGHTING_SETTINGS);
        } else {
            parseMetadata(preset.metadata, 'lighting');
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

        if (settings.cameraDetails) {
            setCameraSettings(prev => ({ ...prev, ...settings.cameraDetails }));
        }
        if (settings.lightingDetails) {
            setLightingSettings(prev => ({...prev, ...settings.lightingDetails}));
        }
    }, []);
    
    const canGenerateStudio = !!productImage && customPrompt.trim() !== '' && !isLoading && isOnline;

    const handleGenerateStudio = useCallback(async () => {
        if (!canGenerateStudio || !productImage) return;
        setIsLoading(true);
        setStudioGeneratedImage(null);
        setGenerationGeneratedImages(null);
        setGenerationPrompt('');
        setNegativePrompt('');
        
        const finalSettings: ChosenSettings = {
            Camera: selectedCameras[0].name,
            cameraDetails: cameraSettings,
            Lighting: selectedLightings.map(p => p.name).filter(n => n !== 'None').join(', ') || 'None',
            lightingDetails: lightingSettings,
            Mockup: selectedMockups[0].name,
            Manipulation: selectedManipulations.map(p => p.name).filter(n => n !== 'None').join(', ') || 'None',
            'Product Retouch': selectedRetouches.map(p => p.name).filter(n => n !== 'None').join(', ') || 'None',
            'People Retouch': selectedPeopleRetouches.map(p => p.name).filter(n => n !== 'None').join(', ') || 'None',
        };

        try {
            const generatedImageResult = await generateFinalImage(productImage, referenceImage, customPrompt, finalSettings, exportSettings);
            if (generatedImageResult) {
                setStudioGeneratedImage(generatedImageResult);
                const historyEntry: HistoryItem = {
                    id: new Date().toISOString(), 
                    generated: [generatedImageResult], 
                    source: productImage,
                    referenceImage: referenceImage, 
                    prompt: customPrompt, 
                    chosenSettings: finalSettings, 
                    exportSettings: exportSettings,
                };
                setHistory(prev => [historyEntry, ...prev]);
            }
        } catch (error) {
            console.error("Generation error:", error);
            alert(`An error occurred during generation: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }, [canGenerateStudio, productImage, referenceImage, customPrompt, exportSettings, selectedCameras, cameraSettings, selectedLightings, lightingSettings, selectedMockups, selectedManipulations, selectedRetouches, selectedPeopleRetouches]);

    const handleImageGeneration = async () => {
        if (generationPrompt.trim() === '' || isLoading || !isOnline) return;
        setIsLoading(true);
        setStudioGeneratedImage(null);
        setGenerationGeneratedImages(null);
        setProductImage(null);
        setReferenceImage(null);
        setCustomPrompt('');
        
        try {
            const results = await generateImageWithImagen(generationPrompt, negativePrompt, exportSettings);
            if (results && results.length > 0) {
                setGenerationGeneratedImages(results);
                const historyEntry: HistoryItem = {
                    id: new Date().toISOString(), 
                    generated: results, 
                    source: null, 
                    referenceImage: null,
                    prompt: generationPrompt, 
                    negativePrompt: negativePrompt, 
                    exportSettings: exportSettings,
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
    
    const handleManualRetouchGenerate = () => {
        handleGenerateRetouch(aiProfile, portraitSettings, portraitPrompt);
    };

    const handleUpscale = useCallback(async (target: UpscaleTarget) => {
        if (!studioGeneratedImage || isUpscaling) return;
        setIsUpscaleMenuOpen(false);
        setIsUpscaling(target);
        try {
            const result = await upscaleImage(studioGeneratedImage, target);
            if (result) {
                setStudioGeneratedImage(result);
                 const historyEntry: HistoryItem = {
                    id: new Date().toISOString() + '-upscaled', 
                    generated: [result], 
                    source: productImage,
                    prompt: `Upscaled to ${target.toUpperCase()}`, referenceImage, exportSettings
                };
                setHistory(prev => [historyEntry, ...prev]);
            } else { alert("Upscale failed: No image was returned by the AI."); }
        } catch (error) {
            console.error("Upscale error:", error);
            alert(`An error occurred during upscaling: ${(error as Error).message}`);
        } finally { setIsUpscaling(false); }
    }, [studioGeneratedImage, isUpscaling, productImage, referenceImage, exportSettings]);
    
    const resetStudioControls = useCallback(() => {
        setSelectedCameras([CAMERA_PRESETS[0]]);
        setSelectedLightings([LIGHTING_PRESETS[0]]);
        setSelectedMockups([MOCKUP_PRESETS[0]]);
        setSelectedManipulations([MANIPULATION_PRESETS[0]]);
        setSelectedPeopleRetouches([PEOPLE_RETOUCH_PRESETS[0]]);
        setSelectedRetouches([RETOUCH_PRESETS[0]]);
        setCameraSettings(DEFAULT_CAMERA_SETTINGS);
        setLightingSettings(DEFAULT_LIGHTING_SETTINGS);
    }, []);

    const handleResetApp = useCallback(() => {
        // Stop any ongoing processes
        setIsLoading(false);
        setIsUpscaling(false);
        setIsGeneratingSuggestions(false);
        setIsGeneratingCameraSuggestions(false);
        setIsAnalyzingPortrait(false);

        // Close any modals/menus
        setIsSuggestionsModalOpen(false);
        setIsUpscaleMenuOpen(false);
        
        // Reset mode to default
        setMode('studio');

        // Reset image states
        setStudioGeneratedImage(null);
        setGenerationGeneratedImages(null);
        setRetouchedImage(null);

        // Reset Studio Mode states
        setProductImage(null);
        setReferenceImage(null);
        setCustomPrompt('');
        setCreativeSuggestions([]);
        setCameraSuggestions([]);

        // Reset Fine-Tune States using existing helper
        resetStudioControls();

        // Reset Generation Mode states
        setGenerationPrompt('');
        setNegativePrompt('');
        
        // Reset Portrait Retouch Mode states
        setPortraitImage(null);
        setPortraitPrompt('');
        setAiAnalysis(null);
        setAiProfile('off');
        setPortraitSettings(DEFAULT_PORTRAIT_SETTINGS.off);

        // Reset Shared states
        setExportSettings({ aspectRatio: '1:1', transparent: false });
    }, [resetStudioControls]);

    const loadFromHistory = (item: HistoryItem) => {
        setExportSettings(item.exportSettings || { aspectRatio: '1:1', transparent: false });

        if (item.source) { // Studio item
            setMode('studio');
            setStudioGeneratedImage(item.generated[0] || null);
            setGenerationGeneratedImages(null);
            setProductImage(item.source);
            setReferenceImage(item.referenceImage || null);
            setCustomPrompt(item.prompt || '');
            if (item.chosenSettings) {
                updateControlsFromSettings(item.chosenSettings);
            } else {
                resetStudioControls();
            }
            setGenerationPrompt('');
            setNegativePrompt('');
        } else { // Generation item
            setMode('generate');
            setGenerationGeneratedImages(item.generated);
            setStudioGeneratedImage(null);
            setGenerationPrompt(item.prompt || '');
            setNegativePrompt(item.negativePrompt || '');
            setProductImage(null);
            setReferenceImage(null);
            setCustomPrompt('');
            resetStudioControls();
        }
    };
    
    const clearStudioHistory = () => {
        setHistory(prev => prev.filter(item => !item.source)); // Keep only generation items
    };

    const clearGenerationHistory = () => {
        setHistory(prev => prev.filter(item => !!item.source)); // Keep only studio items
    };

    const handleSuggestionSelect = (suggestion: SuggestionConcept) => {
        setCustomPrompt(suggestion.prompt_text);
        updateControlsFromSettings(suggestion.settings_json);
        setIsSuggestionsModalOpen(false);
    };
    
    const changeMode = (newMode: 'studio' | 'generate' | 'portrait') => {
        setMode(newMode);
    }

    const modeButtons = (
        <>
            <button onClick={() => changeMode('studio')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${mode === 'studio' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                Creative Studio
            </button>
            <button onClick={() => changeMode('generate')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${mode === 'generate' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                Image Generation
            </button>
            <button onClick={() => changeMode('portrait')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${mode === 'portrait' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
                Portrait Retouch
            </button>
        </>
    );
    
    const socialLinks = (
        <>
            <a href="https://www.instagram.com/adham_oe" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/10 transform transition-all duration-200 hover:scale-110 hover:text-white" title="Instagram"><InstagramIcon className="w-5 h-5" /></a>
            <a href="https://www.facebook.com/adhamosama.oe" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/10 transform transition-all duration-200 hover:scale-110 hover:text-white" title="Facebook"><FacebookIcon className="w-5 h-5" /></a>
            <a href="https://www.behance.net/Adham-Osama" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/10 transform transition-all duration-200 hover:scale-110 hover:text-white" title="Behance"><BehanceIcon className="w-5 h-5" /></a>
        </>
    );

    return (
        <div className="min-h-screen lg:h-screen flex flex-col">
            <header className="relative flex-shrink-0 p-3 sm:p-4 flex justify-between items-center bg-black/30 backdrop-blur-xl border-b border-[var(--border-color)] z-30">
                <button onClick={handleResetApp} aria-label="Reset application to default state" className="flex items-center gap-3 group">
                    <LogoIcon className="w-8 h-8 text-[var(--accent-color)] transition-transform duration-300 ease-in-out group-hover:rotate-[15deg] group-hover:scale-110" />
                    <h1 className="text-xl sm:text-2xl font-bold from-slate-200 to-slate-400 bg-gradient-to-r bg-clip-text text-transparent tracking-wide">
                        ADHOM AI <span className="font-light hidden sm:inline">Creative Studio</span>
                    </h1>
                </button>

                {/* Desktop Mode Switcher */}
                <div className="hidden lg:flex items-center gap-2 p-1 bg-black/20 rounded-full border border-[var(--border-color)]">
                    {modeButtons}
                </div>

                <div className="flex items-center gap-4">
                     {/* Desktop Social Links */}
                    <div className="hidden lg:flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <span className="mr-2">Follow:</span>
                        {socialLinks}
                    </div>
                </div>
            </header>

            <main className="flex-grow lg:min-h-0 p-2 sm:p-4">
                {mode === 'studio' && (
                    <div className="flex flex-col lg:grid grid-cols-1 lg:grid-cols-[420px_1fr] xl:grid-cols-[520px_1fr_420px] gap-2 sm:gap-4 h-full pb-20 lg:pb-0">
                        <aside className="w-full flex-shrink-0 bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden lg:min-h-0">
                            <ControlPanel
                                exportSettings={exportSettings} setExportSettings={setExportSettings}
                                productImage={productImage} setProductImage={setProductImage}
                                referenceImage={referenceImage} setReferenceImage={setReferenceImage}
                                customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
                                onGetSuggestions={handleGetSuggestions} isGeneratingSuggestions={isGeneratingSuggestions}
                                onGenerate={handleGenerateStudio} canGenerate={canGenerateStudio} isLoading={isLoading} generatedImage={studioGeneratedImage}
                                isUpscaling={isUpscaling} onUpscale={handleUpscale} isOnline={isOnline}
                                upscaleMenuRef={upscaleMenuRef} isUpscaleMenuOpen={isUpscaleMenuOpen} setIsUpscaleMenuOpen={setIsUpscaleMenuOpen}
                            />
                        </aside>
                        <section className="relative flex items-center justify-center lg:flex-grow lg:h-full animated-viewer-bg rounded-2xl overflow-hidden order-first lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 xl:col-start-2 xl:row-span-1">
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" style={{ backgroundSize: '30px 30px' }}></div>
                             <ImageViewer productImage={productImage} generatedImage={studioGeneratedImage} isGenerating={isLoading} aspectRatio={exportSettings.aspectRatio}/>
                        </section>
                        <aside className="w-full lg:min-h-0 flex flex-col gap-2 sm:gap-4 lg:col-start-1 lg:row-start-2 xl:col-start-3 xl:row-start-1">
                            <FineTunePanel
                                productImage={productImage}
                                customPrompt={customPrompt}
                                cameraSuggestions={cameraSuggestions}
                                isGeneratingCameraSuggestions={isGeneratingCameraSuggestions}
                                selectedCameras={selectedCameras} onCameraSelect={handleCameraSelect}
                                selectedLightings={selectedLightings} onLightingSelect={handleLightingSelect}
                                selectedMockups={selectedMockups} onMockupSelect={(p) => handlePresetSelect(p, selectedMockups, setSelectedMockups, MOCKUP_PRESETS, true)}
                                selectedManipulations={selectedManipulations} onManipulationSelect={(p) => handlePresetSelect(p, selectedManipulations, setSelectedManipulations, MANIPULATION_PRESETS)}
                                selectedPeopleRetouches={selectedPeopleRetouches} onPeopleRetouchSelect={(p) => handlePresetSelect(p, selectedPeopleRetouches, setSelectedPeopleRetouches, PEOPLE_RETOUCH_PRESETS)}
                                selectedRetouches={selectedRetouches} onRetouchSelect={(p) => handlePresetSelect(p, selectedRetouches, setSelectedRetouches, RETOUCH_PRESETS)}
                                cameraSettings={cameraSettings} setCameraSettings={setCameraSettings}
                                lightingSettings={lightingSettings} setLightingSettings={setLightingSettings}
                            />
                            <div className="flex-shrink-0 bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl">
                                <div className="p-3 sm:p-4"><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-lg flex items-center gap-2 text-[var(--text-light)]"><HistoryIcon className="w-6 h-6" /> History</h3>
                                        {studioHistory.length > 0 && (<button onClick={clearStudioHistory} className="text-sm font-semibold text-red-400/80 hover:text-red-400 transition-colors px-3 py-1 rounded-lg hover:bg-red-500/10">Clear All</button>)}
                                    </div>
                                    {studioHistory.length === 0 ? (<div className="text-center text-[var(--text-disabled)] py-10"><p className="font-semibold">Your generations will appear here.</p><p className="text-sm">Start a new project to see your creative history.</p></div>
                                    ) : ( <div className="flex overflow-x-auto gap-4 pb-2"> {studioHistory.map(item => (item.generated && item.generated.length > 0) && ( <div key={item.id} onClick={() => loadFromHistory(item)} className="cursor-pointer group flex-shrink-0 text-center relative" title={`Prompt: ${item.prompt}\nDate: ${new Date(item.id.split('-upscaled')[0]).toLocaleString()}`}><img src={`data:${item.generated[0].mimeType};base64,${item.generated[0].base64}`} alt="History thumbnail" className="w-32 h-32 object-cover rounded-lg border-2 border-transparent group-hover:border-[var(--accent-color)] transition-all duration-200 transform group-hover:scale-105" /> <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"><p className="text-white text-xs font-semibold text-center line-clamp-4">{item.prompt}</p></div> </div>))}</div>)}
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
                
                {mode === 'generate' && (
                    <div className="flex flex-col lg:grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_1fr] gap-2 sm:gap-4 h-full pb-20 lg:pb-0">
                        <aside className="w-full flex-shrink-0 h-full">
                           <GenerationPanel
                                prompt={generationPrompt} setPrompt={setGenerationPrompt}
                                negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt}
                                exportSettings={exportSettings} setExportSettings={setExportSettings}
                                onGenerate={handleImageGeneration}
                                isLoading={isLoading}
                                isOnline={isOnline}
                                history={generationHistory}
                                onLoadHistory={loadFromHistory}
                                onClearHistory={clearGenerationHistory}
                           />
                        </aside>
                        <section className="relative flex items-center justify-center lg:flex-grow lg:h-full animated-viewer-bg rounded-2xl overflow-hidden order-first lg:order-none">
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" style={{ backgroundSize: '30px 30px' }}></div>
                             <ImageViewer 
                                productImage={null} 
                                generatedImage={null}
                                generatedImages={generationGeneratedImages}
                                isGenerating={isLoading} 
                                aspectRatio={exportSettings.aspectRatio}
                            />
                        </section>
                    </div>
                )}
                
                {mode === 'portrait' && (
                    <div className="flex flex-col lg:grid grid-cols-1 lg:grid-cols-[420px_1fr] xl:grid-cols-[520px_1fr_420px] gap-2 sm:gap-4 h-full pb-20 lg:pb-0">
                        <aside className="w-full flex-shrink-0 h-full">
                            <PortraitRetouchPanel 
                                portraitImage={portraitImage} setPortraitImage={setPortraitImage}
                                aiAnalysis={aiAnalysis}
                                isAnalyzing={isAnalyzingPortrait}
                                activeProfile={aiProfile}
                                onProfileChange={setAiProfile}
                                onGenerate={handleManualRetouchGenerate}
                                isLoading={isLoading} isOnline={isOnline}
                                retouchedImage={retouchedImage}
                                portraitPrompt={portraitPrompt}
                                setPortraitPrompt={setPortraitPrompt}
                            />
                        </aside>
                        <section className="relative flex items-center justify-center lg:flex-grow lg:h-full animated-viewer-bg rounded-2xl overflow-hidden order-first lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 xl:col-start-2 xl:row-span-1">
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" style={{ backgroundSize: '30px 30px' }}></div>
                             <ImageViewer productImage={portraitImage} generatedImage={retouchedImage} isGenerating={isLoading} aspectRatio={'4:5'}/>
                        </section>
                        <aside className="w-full lg:min-h-0 flex flex-col lg:col-start-1 lg:row-start-2 xl:col-start-3 xl:row-start-1">
                            <PortraitTunePanel 
                                settings={portraitSettings}
                                onSettingChange={(key, value) => setPortraitSettings(prev => ({...prev, [key]: value}))}
                                isProfileActive={aiProfile !== 'off'}
                            />
                        </aside>
                    </div>
                )}

            </main>
            <BottomNavBar mode={mode} onModeChange={changeMode} />
            <SuggestionsModal isOpen={isSuggestionsModalOpen} suggestions={creativeSuggestions} onSelect={handleSuggestionSelect} onClose={() => setIsSuggestionsModalOpen(false)} />
        </div>
    );
};

export default App;

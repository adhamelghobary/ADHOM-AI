import React from 'react';
import { CameraPreset, LightingPreset, MockupPreset, ManipulationPreset, RetouchPreset, PeopleRetouchPreset, ImageFile, CameraSettings, LightingSettings } from '../types';
import { CAMERA_PRESETS, LIGHTING_PRESETS, MOCKUP_PRESETS, MANIPULATION_PRESETS, RETOUCH_PRESETS, PEOPLE_RETOUCH_PRESETS } from '../constants';
import { CameraIcon, SunIcon, CubeTransparentIcon, WandIcon, LayersIcon, UserIcon, SlidersHorizontalIcon } from './Icons';
import AccordionItem from './AccordionItem';
import PresetSelector from './PresetSelector';
import Slider from './Slider';

interface FineTunePanelProps {
    productImage: ImageFile | null;
    customPrompt: string;
    cameraSuggestions: string[];
    isGeneratingCameraSuggestions: boolean;
    selectedCameras: CameraPreset[];
    onCameraSelect: (preset: CameraPreset) => void;
    selectedLightings: LightingPreset[];
    onLightingSelect: (preset: LightingPreset) => void;
    selectedMockups: MockupPreset[];
    onMockupSelect: (preset: MockupPreset) => void;
    selectedManipulations: ManipulationPreset[];
    onManipulationSelect: (preset: ManipulationPreset) => void;
    selectedPeopleRetouches: PeopleRetouchPreset[];
    onPeopleRetouchSelect: (preset: PeopleRetouchPreset) => void;
    selectedRetouches: RetouchPreset[];
    onRetouchSelect: (preset: RetouchPreset) => void;
    cameraSettings: CameraSettings;
    setCameraSettings: React.Dispatch<React.SetStateAction<CameraSettings>>;
    lightingSettings: LightingSettings;
    setLightingSettings: React.Dispatch<React.SetStateAction<LightingSettings>>;
}

const FineTunePanel: React.FC<FineTunePanelProps> = (props) => {
    const {
        productImage, customPrompt, cameraSuggestions, isGeneratingCameraSuggestions,
        selectedCameras, onCameraSelect, selectedLightings, onLightingSelect,
        selectedMockups, onMockupSelect, selectedManipulations, onManipulationSelect,
        selectedPeopleRetouches, onPeopleRetouchSelect, selectedRetouches, onRetouchSelect,
        cameraSettings, setCameraSettings, lightingSettings, setLightingSettings,
    } = props;

    const handleCameraSettingChange = <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
        setCameraSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleLightingSettingChange = <K extends keyof LightingSettings>(key: K, value: LightingSettings[K]) => {
        setLightingSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden flex-grow min-h-0">
            <div className="p-3 sm:p-4 border-b border-[var(--border-color)] flex-shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <SlidersHorizontalIcon className="w-6 h-6 text-[var(--accent-color)]" />
                    Fine-Tune Your Shot
                </h2>
            </div>

            <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-2">
                 <AccordionItem 
                    title="Camera" 
                    icon={<CameraIcon className="w-6 h-6 text-[var(--accent-color)]" />} 
                    isOpenDefault={true}
                    isAnalyzing={isGeneratingCameraSuggestions}
                 >
                    <div className="space-y-4">
                        <div>
                             { selectedCameras[0]?.id === 'none' && !isGeneratingCameraSuggestions && cameraSuggestions.length === 0 && (!productImage || !customPrompt) && (
                                <p className="text-xs text-center text-yellow-400/80 mb-3 p-2 bg-yellow-900/20 rounded-lg border border-yellow-400/20">
                                    Upload an image and add a creative prompt to get AI camera suggestions.
                                </p>
                            )}
                            { isGeneratingCameraSuggestions && (
                                <p className="text-sm text-center text-indigo-300 mb-3 animate-pulse">AI is suggesting camera angles...</p>
                            )}
                            <h4 className="font-semibold text-sm text-gray-300 mb-2">Presets</h4>
                            <PresetSelector presets={CAMERA_PRESETS} selectedPresets={selectedCameras} onSelect={onCameraSelect} suggestedIds={cameraSuggestions} highlightSuggestions={cameraSuggestions.length > 0} />
                        </div>
                        <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                            <h4 className="font-semibold text-sm text-gray-300 -mb-1">Detailed Controls</h4>
                            <Slider label="Focal Length" value={cameraSettings.focalLength} onChange={v => handleCameraSettingChange('focalLength', v)} min={14} max={200} valueSuffix="mm" />
                            <Slider label="Aperture" value={cameraSettings.aperture} onChange={v => handleCameraSettingChange('aperture', v)} min={1.2} max={22} step={0.1} valuePrefix="f/" />
                            <Slider label="Shutter Speed" value={cameraSettings.shutterSpeed} onChange={v => handleCameraSettingChange('shutterSpeed', v)} min={1} max={8000} valuePrefix="1/" valueSuffix="s" />
                            <Slider label="Height" value={cameraSettings.height} onChange={v => handleCameraSettingChange('height', v)} min={0} max={200} valueSuffix="cm" />
                            <Slider label="Pitch" value={cameraSettings.pitch} onChange={v => handleCameraSettingChange('pitch', v)} min={-90} max={90} valueSuffix="°" />
                            <Slider label="Roll" value={cameraSettings.roll} onChange={v => handleCameraSettingChange('roll', v)} min={-45} max={45} valueSuffix="°" />
                        </div>
                    </div>
                </AccordionItem>
                <AccordionItem title="Lighting" icon={<SunIcon className="w-6 h-6 text-[var(--accent-color)]" />} isOpenDefault={false}>
                     <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-300 mb-2">Presets</h4>
                            <PresetSelector presets={LIGHTING_PRESETS} selectedPresets={selectedLightings} onSelect={onLightingSelect} />
                        </div>
                        <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                             <h4 className="font-semibold text-sm text-gray-300 -mb-1">Detailed Controls</h4>
                             <Slider label="Temperature" value={lightingSettings.temperature} onChange={v => handleLightingSettingChange('temperature', v)} min={2000} max={10000} step={50} valueSuffix="K" />
                             <Slider label="Intensity" value={lightingSettings.intensity} onChange={v => handleLightingSettingChange('intensity', v)} min={0} max={100} valueSuffix="%" />
                             <Slider label="Hardness" value={lightingSettings.hardness} onChange={v => handleLightingSettingChange('hardness', v)} min={0} max={100} valueSuffix="%" />
                        </div>
                    </div>
                </AccordionItem>
                <AccordionItem
                    title="Mockup"
                    icon={<CubeTransparentIcon className="w-6 h-6 text-[var(--accent-color)]" />}
                    isOpenDefault={false}
                >
                    <PresetSelector presets={MOCKUP_PRESETS} selectedPresets={selectedMockups} onSelect={onMockupSelect} />
                </AccordionItem>
                <AccordionItem title="Manipulation" icon={<LayersIcon className="w-6 h-6 text-[var(--accent-color)]" />} isOpenDefault={false}>
                    <PresetSelector presets={MANIPULATION_PRESETS} selectedPresets={selectedManipulations} onSelect={onManipulationSelect} />
                </AccordionItem>
                <AccordionItem title="Product Retouch" icon={<WandIcon className="w-6 h-6 text-[var(--accent-color)]" />} isOpenDefault={false}>
                    <PresetSelector presets={RETOUCH_PRESETS} selectedPresets={selectedRetouches} onSelect={onRetouchSelect} />
                </AccordionItem>
                <AccordionItem title="People Retouch" icon={<UserIcon className="w-6 h-6 text-[var(--accent-color)]" />} isOpenDefault={false}>
                    <PresetSelector presets={PEOPLE_RETOUCH_PRESETS} selectedPresets={selectedPeopleRetouches} onSelect={onPeopleRetouchSelect} />
                </AccordionItem>
            </div>
        </div>
    );
};

export default FineTunePanel;
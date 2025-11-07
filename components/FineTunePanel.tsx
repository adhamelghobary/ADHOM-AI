

import React from 'react';
import { CameraPreset, LightingPreset, MockupPreset, ManipulationPreset, RetouchPreset, PeopleRetouchPreset } from '../types';
import { CAMERA_PRESETS, LIGHTING_PRESETS, MOCKUP_PRESETS, MANIPULATION_PRESETS, RETOUCH_PRESETS, PEOPLE_RETOUCH_PRESETS } from '../constants';
import { CameraIcon, SunIcon, CubeTransparentIcon, WandIcon, LayersIcon, UserIcon, SlidersHorizontalIcon } from './Icons';
import AccordionItem from './AccordionItem';
import PresetSelector from './PresetSelector';

interface FineTunePanelProps {
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
}

const FineTunePanel: React.FC<FineTunePanelProps> = (props) => {
    const {
        selectedCameras, onCameraSelect, selectedLightings, onLightingSelect,
        selectedMockups, onMockupSelect, selectedManipulations, onManipulationSelect,
        selectedPeopleRetouches, onPeopleRetouchSelect, selectedRetouches, onRetouchSelect,
    } = props;

    return (
        <div className="bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden flex-grow min-h-0">
            <div className="p-4 border-b border-[var(--border-color)] flex-shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <SlidersHorizontalIcon className="w-6 h-6 text-[var(--accent-color)]" />
                    Fine-Tune Your Shot
                </h2>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2">
                 <AccordionItem title="Camera" icon={<CameraIcon className="w-6 h-6 text-[var(--accent-color)]" />} isOpenDefault={true}>
                    <PresetSelector presets={CAMERA_PRESETS} selectedPresets={selectedCameras} onSelect={onCameraSelect} />
                </AccordionItem>
                <AccordionItem title="Lighting" icon={<SunIcon className="w-6 h-6 text-[var(--accent-color)]" />} isOpenDefault={false}>
                    <PresetSelector presets={LIGHTING_PRESETS} selectedPresets={selectedLightings} onSelect={onLightingSelect} />
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
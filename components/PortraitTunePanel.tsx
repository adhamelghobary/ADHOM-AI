
import React, { useState } from 'react';
import { PortraitRetouchSettings } from '../types';
import { SlidersHorizontalIcon } from './Icons';
import Slider from './Slider';
import ToggleSwitch from './ToggleSwitch';

interface PortraitTunePanelProps {
    settings: PortraitRetouchSettings;
    onSettingChange: <K extends keyof PortraitRetouchSettings>(key: K, value: PortraitRetouchSettings[K]) => void;
    isProfileActive: boolean;
}

const ControlGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/20 border border-[var(--border-color)] rounded-xl p-3 sm:p-4">
        <h3 className="font-bold text-lg text-white mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const PortraitTunePanel: React.FC<PortraitTunePanelProps> = ({ settings, onSettingChange, isProfileActive }) => {
    
    const handleBackgroundEnhancementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as PortraitRetouchSettings['backgroundEnhancement'];
        onSettingChange('backgroundEnhancement', value);
        if (value !== 'replace') {
            onSettingChange('backgroundReplacementPrompt', '');
        }
    };
    
    return (
        <div className={`bg-[rgba(16,18,27,0.5)] backdrop-blur-[30px] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden h-full transition-opacity duration-300 ${isProfileActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="p-3 sm:p-4 border-b border-[var(--border-color)] flex-shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                    <SlidersHorizontalIcon className="w-6 h-6 text-[var(--accent-color)]" />
                    Fine-Tune Retouch
                </h2>
            </div>

            <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                 {!isProfileActive && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-2xl">
                        <p className="text-lg font-semibold text-center text-white p-4">Select a profile to enable controls.</p>
                    </div>
                 )}
                <ControlGroup title="Skin Control">
                    <ToggleSwitch label="AI Healing (Blemishes)" checked={settings.blemishRemoval} onChange={v => onSettingChange('blemishRemoval', v)} />
                    <Slider label="Smoothness" value={settings.skinSmoothing} onChange={v => onSettingChange('skinSmoothing', v)} />
                    <Slider label="Texture" value={settings.skinTexture} onChange={v => onSettingChange('skinTexture', v)} />
                </ControlGroup>
                
                <ControlGroup title="Face Sculpt">
                    <Slider label="Jaw" value={settings.jawSculpt} onChange={v => onSettingChange('jawSculpt', v)} />
                    <Slider label="Nose" value={settings.noseSculpt} onChange={v => onSettingChange('noseSculpt', v)} />
                    <Slider label="Eyes" value={settings.eyeSculpt} onChange={v => onSettingChange('eyeSculpt', v)} />
                </ControlGroup>

                <ControlGroup title="Background">
                     <div>
                        <label htmlFor="bg-enhancement" className="block text-sm font-medium text-[var(--text-muted)] mb-1">Background Effect</label>
                        <select
                            id="bg-enhancement"
                            value={settings.backgroundEnhancement}
                            onChange={handleBackgroundEnhancementChange}
                            className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-md p-2 text-white focus:ring-2 focus:ring-[var(--accent-color)]"
                        >
                            <option value="keep" className="bg-gray-800">Keep Original</option>
                            <option value="blur" className="bg-gray-800">AI Bokeh / Blur</option>
                            <option value="desaturate" className="bg-gray-800">Desaturate</option>
                            <option value="replace" className="bg-gray-800">AI Replace</option>
                        </select>
                    </div>
                    {settings.backgroundEnhancement === 'replace' && (
                        <div>
                             <label htmlFor="bg-replace-prompt" className="block text-sm font-medium text-[var(--text-muted)] mb-1">Describe New Background</label>
                             <input
                                type="text"
                                id="bg-replace-prompt"
                                value={settings.backgroundReplacementPrompt || ''}
                                onChange={(e) => onSettingChange('backgroundReplacementPrompt', e.target.value)}
                                placeholder="e.g., a futuristic city, a serene forest"
                                className="w-full bg-black/30 border border-[var(--border-color)] rounded-md p-2 text-white placeholder-[var(--text-disabled)] shadow-inner shadow-black/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                            />
                        </div>
                    )}
                </ControlGroup>
            </div>
        </div>
    );
};

export default PortraitTunePanel;

import React from 'react';
import { Preset } from '../types';

interface PresetSelectorProps<T extends Preset> {
    presets: readonly T[];
    selectedPresets: T[];
    onSelect: (preset: T) => void;
    suggestedIds?: string[];
    highlightSuggestions?: boolean;
}

const PresetSelector = <T extends Preset,>({ presets, selectedPresets, onSelect, suggestedIds = [], highlightSuggestions = false }: PresetSelectorProps<T>) => {
    return (
        <div>
            <div className="space-y-2">
                {presets.map((preset) => {
                    const isSelected = selectedPresets.some(p => p.id === preset.id);
                    const isSuggested = highlightSuggestions && suggestedIds.includes(preset.id);
                    return (
                        <button
                            key={preset.id}
                            onClick={() => onSelect(preset)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-4 transform hover:scale-[1.03] active:scale-[0.99] ${
                                isSelected
                                    ? 'bg-[var(--accent-color)] border-transparent shadow-lg shadow-[var(--accent-color)]/20 text-white'
                                    : isSuggested
                                        ? 'bg-white/5 border-[var(--accent-color)]/50 hover:border-[var(--accent-color)] hover:bg-[var(--accent-color)]/10'
                                        : 'bg-white/5 border-transparent hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/10'
                            }`}
                        >
                            <div className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-[var(--accent-color)]'}`}>{preset.icon}</div>
                            <div className="flex-1">
                                <p className={`font-semibold ${isSelected ? 'text-white' : 'text-[#F0F0F0]'} flex items-center gap-2`}>
                                    {preset.name}
                                    {isSuggested && (
                                        <span className="text-xs font-bold text-[var(--accent-color)] bg-[var(--accent-color)]/20 px-2 py-0.5 rounded-full border border-[var(--accent-color)]/50">AI Pick</span>
                                    )}
                                </p>
                                <p className={`text-sm ${isSelected ? 'text-gray-200' : 'text-[#B0B0B0]'} leading-tight`}>{preset.description}</p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default PresetSelector;
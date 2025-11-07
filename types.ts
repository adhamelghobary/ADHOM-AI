import React from 'react';

export interface Preset {
    id: string;
    name: string;
    description: string;
    // FIX: Changed icon type to be a more specific React.ReactElement to allow cloning with props.
    icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
    metadata?: string;
}

export interface CameraPreset extends Preset {
    metadata: string;
}

export interface LightingPreset extends Preset {
    metadata: string;
}

export interface MockupPreset extends Preset {
    // no extra fields
}

export interface ManipulationPreset extends Preset {
    // no extra fields
}

export interface PeopleRetouchPreset extends Preset {
    // no extra fields
}

export interface RetouchPreset extends Preset {
    // no extra fields
}

export type AspectRatio = '9:16' | '4:5' | '1:1' | '3:2' | '16:9';

export interface ExportSettings {
    aspectRatio: AspectRatio;
    transparent: boolean;
}

export interface ImageFile {
    file: File;
    base64: string;
    mimeType: string;
}

export type UpscaleTarget = 'hd' | '4k';

export interface ChosenSettings {
    Camera: string;
    Lighting: string;
    Mockup: string;
    Manipulation: string;
    'Product Retouch': string;
    'People Retouch': string;
}

export interface HistoryItem {
    id: string;
    generated: { base64: string; mimeType: string };
    source: ImageFile | null;
    referenceImage: ImageFile | null;
    prompt: string;
    chosenSettings?: ChosenSettings;
    exportSettings?: ExportSettings;
    negativePrompt?: string;
}


export interface PromptSuggestion {
    title: string;
    prompt: string;
}

export interface SuggestionConcept {
    concept_title: string;
    prompt_text: string;
    settings_json: ChosenSettings;
}
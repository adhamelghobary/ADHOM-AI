
import React from 'react';

export interface Preset {
    id: string;
    name: string;
    description: string;
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

export interface CameraSettings {
    focalLength: number; // in mm
    aperture: number; // f-stop
    shutterSpeed: number; // 1/x seconds, store x
    height: number; // in cm
    pitch: number; // in degrees
    roll: number; // in degrees
}

export interface LightingSettings {
    temperature: number; // in Kelvin
    intensity: number; // percentage
    hardness: number; // percentage (0 = soft, 100 = hard)
}


export interface ChosenSettings {
    Camera: string;
    cameraDetails?: CameraSettings;
    Lighting: string;
    lightingDetails?: LightingSettings;
    Mockup: string;
    Manipulation: string;
    'Product Retouch': string;
    'People Retouch': string;
}


export interface HistoryItem {
    id: string;
    generated: Array<{ base64: string; mimeType: string }>;
    source: ImageFile | null;
    referenceImage: ImageFile | null;
    prompt: string;
    chosenSettings?: ChosenSettings;
    exportSettings?: ExportSettings;
    negativePrompt?: string;
}

export interface SuggestionConcept {
    concept_title: string;
    prompt_text: string;
    settings_json: Partial<ChosenSettings>;
}

export type AiProfile = 'male' | 'female' | 'child' | 'senior' | 'professional' | 'glamour' | 'off';

export interface AiAnalysisReport {
    profile: AiProfile | 'group';
    age_estimation: string;
    lighting_quality: string;
    focus_quality: string;
    key_observations: string[];
}

export interface PortraitRetouchSettings {
  // Bools
  blemishRemoval: boolean;
  eyeEnhancement: boolean;
  clothingWrinkleRemoval: boolean;
  lightingCorrection: boolean;
  colorCastFix: boolean;

  // Sliders (0-100)
  skinSmoothing: number;
  skinTexture: number; 
  wrinkleReduction: number;
  shineRemoval: number;
  darkCircleReduction: number;
  teethWhitening: number;
  
  // Sculpting
  jawSculpt: number;
  noseSculpt: number;
  eyeSculpt: number; 
  
  // Hair
  flyawayHairRemoval: number;
  hairShineEnhancement: number;
  
  // Background
  backgroundEnhancement: 'keep' | 'blur' | 'desaturate' | 'replace';
  backgroundReplacementPrompt?: string;

  // Effects
  colorGrading: 'none' | 'cinematic' | 'warm' | 'cool' | 'vintage';
  filmGrain: number;
}

export interface DirectorResult {
    id: string;
    shotLabel: string;
    image: {
        base64: string;
        mimeType: string;
    };
}

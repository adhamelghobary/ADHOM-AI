
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ImageFile, UpscaleTarget, ChosenSettings, SuggestionConcept, ExportSettings, AspectRatio, HistoryItem, PortraitRetouchSettings, AiProfile, AiAnalysisReport, CameraSettings, LightingSettings } from '../types';
import { CAMERA_PRESETS, LIGHTING_PRESETS, MOCKUP_PRESETS, MANIPULATION_PRESETS, RETOUCH_PRESETS, PEOPLE_RETOUCH_PRESETS } from '../constants';

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// ============================================================================
// 1. THE AI ART DIRECTOR (SYSTEM INSTRUCTION)
// ============================================================================

const DIRECTOR_SYSTEM_INSTRUCTION = `
Role: You are the "AI Art Director" for a professional product photography studio.
Task: You will receive a "briefing file" (JSON) containing the product description, category, user text, style ref, and camera angle. Your job is to output the "Final Order" (Positive and Negative prompts) for the image generator.

Your Thinking Process (The Logic):

1. **Check the Creative Direction Text (user_scene_request)**
   - **Case A: Box is Empty ("")**
     - You MUST invent a professional scene from scratch based on the **Product Category**.
     - Example: If "Beverage", invent "A refreshing scene with water splashes and ice".
     - This becomes the "Core Idea".
   - **Case B: Box is Full**
     - Respect the user's vision. The text they wrote is the "Core Idea".

2. **Weave All Threads Together (The "Director" Phase)**
   - Combine the "Core Idea" with:
     - **Product Description** (subject_description)
     - **Camera Angle** (camera_angle_selection) - GIVE PRIORITY to this if it conflicts with the Core Idea (e.g., user chose "Macro").
     - **Style Description** (style_ref_description)

3. **Add the "Professional Polish"**
   - Add magic words: "8K quality, professional commercial photography, hyperrealistic, cinematic lighting, sharp focus".

4. **Define the "Don'ts" (Negative Prompt)**
   - List things to avoid: "blurry, cartoon, deformed, low quality, watermark, text, ugly, distorted, drawing, painting, illustration, 3D render, CGI, anime, sketch".

Output Format:
Return a SINGLE JSON object:
{
  "positive_prompt": "The final positive command...",
  "negative_prompt": "The final negative command..."
}
`;

// ============================================================================
// ERROR HANDLING
// ============================================================================

const handleGeminiError = (error: unknown, context: string): never => {
    console.error(`Error during ${context}:`, error);

    let message = `An unexpected error occurred during ${context}.`;

    if (error instanceof Error && error.message) {
        try {
            const errorJson = JSON.parse(error.message);
            const geminiError = errorJson.error;

            if (geminiError) {
                if (geminiError.status === 'RESOURCE_EXHAUSTED' || geminiError.code === 429) {
                    message = "API Rate Limit Exceeded. You've used up your current quota. Please check your plan and billing details.";
                } else if (geminiError.message) {
                    message = `AI Error: ${geminiError.message}`;
                } else {
                    message = `An API error occurred: ${geminiError.status || 'Unknown'}`;
                }
            } else {
                 message = error.message;
            }
        } catch (e) {
            message = error.message;
        }
    }
    
    throw new Error(message);
};

// ============================================================================
// 2. PROMPT SYNTHESIS (DIRECTOR MODE)
// ============================================================================

export const generateDirectorPrompts = async (
    productImage: ImageFile,
    referenceImage: ImageFile | null,
    customPrompt: string,
    finalSettings: ChosenSettings
): Promise<{ positive_prompt: string; negative_prompt: string }> => {
    const model = 'gemini-2.5-pro'; // Using Pro for high-reasoning prompt engineering

    // Build technical strings
    let cameraSelection = finalSettings.Camera !== 'None' ? finalSettings.Camera : "None";
    if (finalSettings.cameraDetails && finalSettings.Camera !== 'None') {
        const { focalLength, aperture, shutterSpeed } = finalSettings.cameraDetails;
        cameraSelection += ` (${focalLength}mm, f/${aperture}, 1/${shutterSpeed}s)`;
    }
    
    const styleSelection = referenceImage ? "Analyze the attached style reference image (Image 2)." : "None";
    
    // Prepare the input object as per the system instruction's expectations
    const inputs = {
        subject_keyword: "[PRODUCT]",
        subject_description: "Analyze the attached product image (Image 1) to describe the subject in detail.",
        user_scene_request: customPrompt || "", // Pass empty string if empty, to trigger Case A
        style_ref_description: styleSelection,
        camera_angle_selection: cameraSelection
    };

    const prompt = `
    Here are the inputs for your task:
    ${JSON.stringify(inputs, null, 2)}
    
    **Instructions:**
    1. Image 1 is the Product. Analyze it to populate 'subject_description'.
    2. Image 2 (if provided) is the Style Reference. Analyze it to populate 'style_ref_description'.
    3. Fulfill the "AI Art Director" role defined in your system instructions.
    `;

    const parts: any[] = [
         { text: DIRECTOR_SYSTEM_INSTRUCTION },
         { text: prompt },
         { inlineData: { data: productImage.base64, mimeType: productImage.mimeType } }
    ];
    
    if (referenceImage) {
        parts.push({ inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } });
    }

    try {
        const response = await genAI.models.generateContent({
            model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        positive_prompt: { type: Type.STRING },
                        negative_prompt: { type: Type.STRING },
                    },
                    required: ["positive_prompt", "negative_prompt"]
                }
            }
        });
        
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.warn("Director prompt synthesis failed, falling back to simple construction.", error);
        return {
            positive_prompt: `${customPrompt}, [PRODUCT], commercial photography, photorealistic, 8K`,
            negative_prompt: "blurry, low quality, illustration, 3D render, deformed"
        };
    }
};

// ============================================================================
// 3. THE EXECUTION ENGINE
// ============================================================================

/**
 * Executes the virtual shoot using the synthesized prompts.
 */
export const executeVirtualShoot = async (
    productImage: ImageFile,
    referenceImage: ImageFile | null,
    prompts: { positive_prompt: string, negative_prompt: string },
    exportSettings: ExportSettings
): Promise<{ base64: string; mimeType: string } | null> => {
    const model = 'gemini-2.5-flash-image';

    // 1. Replace the [PRODUCT] token for Gemini's natural language understanding
    const finalPositivePrompt = prompts.positive_prompt.replace(/\[PRODUCT\]/g, "the product shown in the first image");

    // 2. Construct the final instruction for the image model
    // Gemini Flash Image handles positive text instructions best. We append negative constraints.
    const fullPrompt = `
    **INSTRUCTIONS:**
    ${finalPositivePrompt}
    
    **CONSTRAINTS (AVOID):**
    ${prompts.negative_prompt}
    
    **OUTPUT REQUIREMENTS:**
    - Aspect Ratio: ${exportSettings.aspectRatio}
    ${exportSettings.transparent ? '- Background: Transparent (PNG)' : '- Background: Opaque'}
    - Quality: Photorealistic, High Fidelity
    `;

    const parts: any[] = [
        { text: fullPrompt },
        { inlineData: { data: productImage.base64, mimeType: productImage.mimeType } }
    ];
    
    if (referenceImage) {
        parts.push({ inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } });
    }

    try {
        const response = await genAI.models.generateContent({
            model,
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        // Improve Error Handling for blocked generation
        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
             const reason = response.candidates[0].finishReason;
             // console.warn(`Image generation blocked. Reason: ${reason}`);
             throw new Error(`Image generation blocked. Reason: ${reason}`);
        }
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const mimeType = exportSettings.transparent ? 'image/png' : part.inlineData.mimeType;
                return { base64: part.inlineData.data, mimeType };
            }
        }
        
        throw new Error("Generation succeeded, but no image data was returned. The model may have refused the prompt due to safety or complexity constraints.");
    } catch (error) {
        handleGeminiError(error, 'virtual shoot execution');
        return null;
    }
};

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export const generateFinalImage = async (
    productImage: ImageFile,
    referenceImage: ImageFile | null,
    customPrompt: string,
    finalSettings: ChosenSettings,
    exportSettings: ExportSettings
): Promise<{ base64: string; mimeType: string } | null> => {
    
    // Step 1: AI Art Director Synthesis
    // Creates the perfect positive and negative prompts based on all inputs
    const directorPrompts = await generateDirectorPrompts(
        productImage,
        referenceImage,
        customPrompt,
        finalSettings
    );

    // Step 2: Execute the Virtual Shoot
    return await executeVirtualShoot(
        productImage, 
        referenceImage, 
        directorPrompts, 
        exportSettings
    );
};


// ============================================================================
// HELPERS & OTHER SERVICES
// ============================================================================

const buildControlSchema = () => {
  const schema = {
    Camera: CAMERA_PRESETS.filter(p => p.id !== 'none').map(p => p.name),
    Lighting: LIGHTING_PRESETS.filter(p => p.id !== 'none').map(p => p.name),
    Mockup: MOCKUP_PRESETS.filter(p => p.id !== 'none').map(p => p.name),
    Manipulation: MANIPULATION_PRESETS.filter(p => p.id !== 'none').map(p => p.name),
    'Product Retouch': RETOUCH_PRESETS.filter(p => p.id !== 'none').map(p => p.name),
    'People Retouch': PEOPLE_RETOUCH_PRESETS.filter(p => p.id !== 'none').map(p => p.name),
  };
  return schema;
};

export const generateCameraSuggestions = async (
    productImage: ImageFile,
    customPrompt: string
): Promise<string[]> => {
    const model = 'gemini-2.5-flash';
    
    const availablePresets = CAMERA_PRESETS
        .filter(p => p.id !== 'none')
        .map(p => ({ id: p.id, name: p.name, description: p.description }));

    const prompt = `You are an expert product photographer and AI assistant. Your task is to suggest the best camera angles for a product shot.

**Analysis Phase:**
1.  **Analyze the Product Image:** Identify the product's key characteristics (e.g., shape, size, material).
2.  **Analyze the Creative Prompt:** Understand the user's desired mood: "${customPrompt}".

**Task:**
Based on your analysis, choose up to 3 of the most suitable camera presets from the following list.

**Available Presets:**
\`\`\`json
${JSON.stringify(availablePresets, null, 2)}
\`\`\`

**Output Requirement:**
Return a JSON array containing ONLY the string IDs of your top 3 recommended presets.`;

    const parts = [
        { inlineData: { data: productImage.base64, mimeType: productImage.mimeType } },
        { text: prompt }
    ];

    try {
        const response = await genAI.models.generateContent({
            model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonText = response.text.trim();
        const suggestions = JSON.parse(jsonText);
        if (Array.isArray(suggestions) && suggestions.every(item => typeof item === 'string')) {
            return suggestions;
        }
        return [];
    } catch (error) {
        handleGeminiError(error, 'camera angle suggestion generation');
        return [];
    }
};

export const generateImageWithImagen = async (
    prompt: string,
    negativePrompt: string,
    exportSettings: ExportSettings
): Promise<Array<{ base64: string; mimeType: string }> | null> => {
    const model = 'imagen-4.0-generate-001';
    const fullPrompt = negativePrompt ? `${prompt} | negative prompt: ${negativePrompt}` : prompt;

    try {
        const response = await genAI.models.generateImages({
            model,
            prompt: fullPrompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/jpeg',
                aspectRatio: exportSettings.aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages.map(imgData => ({
                base64: imgData.image.imageBytes,
                mimeType: imgData.image.mimeType || 'image/jpeg',
            }));
        }
        throw new Error("Generation succeeded, but the AI did not return any images.");
    } catch (error) {
        handleGeminiError(error, 'image generation with Imagen');
        return null;
    }
};

export const generateCreativeSuggestions = async (
    productImage: ImageFile,
    referenceImage: ImageFile | null,
    userDraft: string,
    cameraConstraint?: string
): Promise<SuggestionConcept[]> => {
    const model = 'gemini-2.5-pro'; // Use Pro for complex instruction following
    const controlSchema = buildControlSchema();

    const systemInstruction = `
You are an expert AI Creative Director for product photography. 
Your goal is to generate 3 distinct, high-quality, photorealistic image generation prompts based on the user's inputs.

**THE 4 SCENARIOS:**
1.  **Product Only (Blank Canvas):** If "User Text" is empty and no Reference is provided.
    - Suggest 3 proven commercial environments:
      - **Option 1 (Minimalist):** Clean composition, studio lighting.
      - **Option 2 (Lifestyle):** Product in a relevant real-world environment.
      - **Option 3 (Creative/Dramatic):** Strong lighting, floating, or creative background.
2.  **Product + Style Ref:** If a Reference Image is provided.
    - Perform "Style Transfer". Merge the product into the style, lighting, and mood of the reference image.
3.  **Product + Text:** If User Text is provided but no Reference.
    - "Prompt Enhancer". Convert the simple user text into a professional, technically detailed prompt (add keywords like '8k', 'studio lighting').
4.  **Full State (Product + Ref + Text):** If both Text and Reference are provided.
    - "The Maestro". Show the [Product] in the [Text Scene] but applying the [Reference Mood/Lighting].

**MANDATORY RULES:**
- **Camera Priority:** If "Camera Constraint" is provided (and not "None"), **YOU MUST** start every single suggestion prompt with this exact phrase. Example: "Hero-45 angle shot of..."
- **Product Fidelity:** The product is the main subject. Do not describe it changing shape or logo.
- **Professional Tone:** Use professional photography terminology.

**OUTPUT:**
Return a JSON Array of exactly 3 suggestions.
Each object must follow this schema:
{
  "concept_title": "Short Descriptive Title",
  "prompt_text": "The full, detailed image generation prompt",
  "settings_json": { ...populate with best matching presets from the provided schema... }
}
`;

    const prompt = `
    **User Inputs:**
    - User Text (Creative Direction): "${userDraft || ''}"
    - Camera Constraint: "${cameraConstraint || 'None'}"
    - Reference Image Provided: ${referenceImage ? 'Yes' : 'No'}
    - Product Image Provided: Yes

    **Control Schema for settings_json:**
    ${JSON.stringify(controlSchema, null, 2)}
    
    **Task:**
    1. Analyze the Product Image (Image 1) to understand the subject.
    2. ${referenceImage ? 'Analyze the Reference Image (Image 2) to extract style/lighting.' : 'No reference image analysis needed.'}
    3. Generate 3 suggestions based on the appropriate Scenario (1-4) defined in the system instructions.
    `;

    const parts: any[] = [
        { text: systemInstruction },
        { inlineData: { mimeType: productImage.mimeType, data: productImage.base64 } }
    ];
    
    if (referenceImage) {
        parts.push({ inlineData: { mimeType: referenceImage.mimeType, data: referenceImage.base64 } });
    }
    parts.push({ text: prompt });

    try {
        const response = await genAI.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            concept_title: { type: Type.STRING },
                            prompt_text: { type: Type.STRING },
                            settings_json: {
                                type: Type.OBJECT,
                                properties: {
                                    "Camera": { type: Type.STRING },
                                    "Lighting": { type: Type.STRING },
                                    "Mockup": { type: Type.STRING },
                                    "Manipulation": { type: Type.STRING },
                                    "Product Retouch": { type: Type.STRING },
                                    "People Retouch": { type: Type.STRING },
                                    "cameraDetails": {
                                        type: Type.OBJECT,
                                        properties: {
                                            focalLength: { type: Type.NUMBER },
                                            aperture: { type: Type.NUMBER },
                                            shutterSpeed: { type: Type.NUMBER },
                                            height: { type: Type.NUMBER },
                                            pitch: { type: Type.NUMBER },
                                            roll: { type: Type.NUMBER },
                                        }
                                    },
                                    "lightingDetails": {
                                        type: Type.OBJECT,
                                        properties: {
                                            temperature: { type: Type.NUMBER },
                                            intensity: { type: Type.NUMBER },
                                            hardness: { type: Type.NUMBER },
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        const suggestions = JSON.parse(jsonText);
        return Array.isArray(suggestions) ? suggestions as SuggestionConcept[] : [];
    } catch (error) {
        handleGeminiError(error, 'creative suggestion generation');
        return [];
    }
};

export const analyzePortraitSubject = async (
    image: ImageFile
): Promise<AiAnalysisReport> => {
    const model = 'gemini-2.5-flash';
    const prompt = `Analyze the provided portrait image for professional retouching.
**Task:** Identify key characteristics of the subject and the photo's quality.

**Analysis Categories:**
1.  **Profile:** "male", "female", "child", "senior", "group", or "off".
2.  **Age Estimation:** General age range.
3.  **Lighting Quality:** Describe the lighting.
4.  **Focus Quality:** Describe the focus.
5.  **Key Observations:** List up to 3 brief, critical observations for retouching.

**Output:** JSON object with keys "profile", "age_estimation", "lighting_quality", "focus_quality", "key_observations".`;

    const parts = [
        { inlineData: { data: image.base64, mimeType: image.mimeType } },
        { text: prompt }
    ];

    try {
        const response = await genAI.models.generateContent({
            model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        profile: { type: Type.STRING },
                        age_estimation: { type: Type.STRING },
                        lighting_quality: { type: Type.STRING },
                        focus_quality: { type: Type.STRING },
                        key_observations: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["profile", "age_estimation", "lighting_quality", "focus_quality", "key_observations"]
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as AiAnalysisReport;
    } catch (error) {
        handleGeminiError(error, 'portrait subject analysis');
        throw error;
    }
};

export const retouchPortraitImage = async (
    image: ImageFile,
    profile: AiProfile,
    settings: PortraitRetouchSettings,
    customPrompt: string
): Promise<{ base64: string; mimeType: string } | null> => {
    const model = 'gemini-2.5-flash-image';
    
    if (profile === 'off') {
        return { base64: image.base64, mimeType: image.mimeType };
    }

    const getIntensity = (value: number): string => {
        if (value > 70) return 'strong';
        if (value > 30) return 'noticeable';
        return 'subtle';
    };

    const promptLines = [
        "Task: Professionally retouch and enhance the provided portrait.",
        "STRICT OUTPUT REQUIREMENTS:",
        "1. Do NOT change the image resolution, width, or height. The output MUST match the original dimensions.",
        "2. Preserve the subject's identity, facial structure, and unique features exactly.",
        "3. Maintain the original image quality. Do not compress or downscale.",
        "4. Do not alter the composition, aspect ratio, or background (unless explicitly instructed to replace).",
    ];

    if (customPrompt && customPrompt.trim() !== '') {
        promptLines.push(`\n**User's Creative Direction:** "${customPrompt}".`);
    }

    promptLines.push(`\n**AI Profile & Technical Settings:**`);

    switch (profile) {
        case 'male':
            promptLines.push("\nStyle: Masculine, sharp, realistic.");
            if (settings.blemishRemoval) promptLines.push("- Remove temporary blemishes, preserve skin texture.");
            if (settings.jawSculpt > 0) promptLines.push(`- Add ${getIntensity(settings.jawSculpt)} definition to jawline.`);
            if (settings.skinSmoothing > 0) promptLines.push(`- Even out skin tone (subtle).`);
            break;
        case 'female':
            promptLines.push("\nStyle: Clean, aesthetic, glowing.");
            if (settings.skinSmoothing > 0) promptLines.push(`- Create smooth skin (${getIntensity(settings.skinSmoothing)}), preserve texture.`);
            if (settings.eyeEnhancement) promptLines.push("- Enhance makeup, brighten eyes.");
            if (settings.jawSculpt > 0 || settings.noseSculpt > 0) promptLines.push("- Subtly sculpt contours.");
            break;
        case 'child':
            promptLines.push("\nStyle: Natural and clean. Minimal corrections.");
            if (settings.lightingCorrection) promptLines.push("- Correct poor lighting.");
            break;
        case 'senior':
            promptLines.push("\nStyle: Dignified, natural, sharp.");
            if (settings.wrinkleReduction > 0) promptLines.push(`- ${getIntensity(settings.wrinkleReduction)} reduction of deep wrinkles (do not remove character lines).`);
            break;
        case 'professional':
            promptLines.push("\nStyle: Corporate headshot. Clean, confident.");
            if (settings.shineRemoval > 0) promptLines.push(`- ${getIntensity(settings.shineRemoval)} reduction of shine.`);
            if (settings.clothingWrinkleRemoval) promptLines.push("- Remove clothing wrinkles.");
            if (settings.teethWhitening > 0) promptLines.push(`- ${getIntensity(settings.teethWhitening)} teeth whitening.`);
            break;
        case 'glamour':
            promptLines.push("\nStyle: High-fashion, flawless, dramatic.");
            if (settings.skinSmoothing > 0) promptLines.push(`- ${getIntensity(settings.skinSmoothing)} skin smoothing.`);
            if (settings.eyeEnhancement) promptLines.push("- Dramatically enhance eyes.");
            if (settings.colorGrading !== 'none') promptLines.push(`- Apply cinematic color grade.`);
            break;
    }

    if (profile !== 'child') {
        if (settings.flyawayHairRemoval > 0) promptLines.push(`- Tame flyaway hairs (${getIntensity(settings.flyawayHairRemoval)}).`);
    }

    promptLines.push("\nFinal Touches:");
    if (settings.backgroundEnhancement === 'blur') promptLines.push("- Apply soft bokeh blur to background.");
    else if (settings.backgroundEnhancement === 'replace') promptLines.push(`- Replace background with: "${settings.backgroundReplacementPrompt || 'neutral studio'}".`);
    else if (settings.backgroundEnhancement === 'desaturate') promptLines.push("- Desaturate background slightly.");
    // 'keep' implies no instruction needed, or explicit instruction to keep.
    else promptLines.push("- Keep background exactly as is.");
    
    if (settings.filmGrain > 0) promptLines.push(`- Add ${getIntensity(settings.filmGrain)} film grain.`);
    
    const fullPrompt = promptLines.join('\n');
    const parts = [{ text: fullPrompt }, { inlineData: { data: image.base64, mimeType: image.mimeType } }];

    try {
        const response = await genAI.models.generateContent({
            model,
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
             throw new Error(`Retouching blocked. Reason: ${response.candidates[0].finishReason}.`);
        }
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return { base64: part.inlineData.data, mimeType: 'image/jpeg' };
            }
        }
        throw new Error("Retouching succeeded, but no image was returned.");
    } catch (error) {
        handleGeminiError(error, 'portrait retouching');
        return null;
    }
};

export const upscaleImage = async (
    baseImage: { base64: string; mimeType: string },
    target: UpscaleTarget,
): Promise<{ base64: string; mimeType: string } | null> => {
    const model = 'gemini-2.5-flash-image';
    
    let upscalePrompt: string;
    if (target === '4k') {
        upscalePrompt = `Perform a professional-grade super-resolution upscale to a 4K resolution (~4096px on the longest side). Preserve all original details and textures perfectly. Do not alter the style or content. Output only the upscaled image.`;
    } else {
        upscalePrompt = `Upscale this image to a high-definition resolution (~2K). Preserve all original details and textures. Output only the upscaled image.`;
    }

    try {
        const response = await genAI.models.generateContent({
            model,
            contents: { parts: [{ inlineData: { data: baseImage.base64, mimeType: baseImage.mimeType } }, { text: upscalePrompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
             throw new Error(`Upscaling blocked. Reason: ${response.candidates[0].finishReason}.`);
        }
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
            }
        }
        throw new Error("Upscaling succeeded, but no image was returned.");
    } catch (error) {
        handleGeminiError(error, 'image upscaling');
        return null;
    }
};

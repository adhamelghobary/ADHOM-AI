import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ImageFile, UpscaleTarget, ChosenSettings, SuggestionConcept, ExportSettings, AspectRatio, HistoryItem, PortraitRetouchSettings, AiProfile, AiAnalysisReport, CameraSettings, LightingSettings } from '../types';
import { CAMERA_PRESETS, LIGHTING_PRESETS, MOCKUP_PRESETS, MANIPULATION_PRESETS, RETOUCH_PRESETS, PEOPLE_RETOUCH_PRESETS } from '../constants';

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * A centralized error handler for Gemini API calls.
 * It parses the error message to provide more specific feedback, especially for rate limiting.
 * @param error The caught error object.
 * @param context A string describing the operation that failed (e.g., 'image generation').
 * @throws An error with a user-friendly message.
 */
const handleGeminiError = (error: unknown, context: string): never => {
    console.error(`Error during ${context}:`, error);

    let message = `An unexpected error occurred during ${context}.`;

    if (error instanceof Error && error.message) {
        // The Gemini SDK often embeds a JSON error object as a string in the message
        try {
            const errorJson = JSON.parse(error.message);
            const geminiError = errorJson.error;

            if (geminiError) {
                if (geminiError.status === 'RESOURCE_EXHAUSTED' || geminiError.code === 429) {
                    message = "API Rate Limit Exceeded. You've used up your current quota. Please check your plan and billing details.";
                } else if (geminiError.message) {
                    // Use the specific message from the API if available
                    message = `AI Error: ${geminiError.message}`;
                } else {
                    message = `An API error occurred: ${geminiError.status || 'Unknown'}`;
                }
            } else {
                 // If parsing works but there's no .error, it might be a different structured error. Use the original message.
                 message = error.message;
            }
        } catch (e) {
            // If the message is not a JSON string, use it directly as it's likely informative.
            message = error.message;
        }
    }
    
    throw new Error(message);
};

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
1.  **Analyze the Product Image:** Identify the product's key characteristics (e.g., shape, size, material, if it's tall like a bottle, flat like a book, etc.).
2.  **Analyze the Creative Prompt:** Understand the user's desired mood and context from their prompt: "${customPrompt}".

**Task:**
Based on your analysis, choose up to 3 of the most suitable camera presets from the following list.

**Available Presets:**
\`\`\`json
${JSON.stringify(availablePresets, null, 2)}
\`\`\`

**Output Requirement:**
Return a JSON array containing ONLY the string IDs of your top 3 recommended presets. For example: ["hero-45", "worms-eye", "macro-edge-detail"].`;

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
        console.warn("Received non-array or invalid data for camera suggestions:", suggestions);
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
    
    // Construct the prompt. The pipe and "negative prompt:" are common conventions.
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

        console.error("No images found in Imagen response.", response);
        throw new Error("Generation succeeded, but the AI did not return any images.");

    } catch (error) {
        handleGeminiError(error, 'image generation with Imagen');
        return null;
    }
};

export const generateCreativeSuggestions = async (
    productImage: ImageFile,
    referenceImage: ImageFile | null,
    userDraft: string
): Promise<SuggestionConcept[]> => {
    const model = 'gemini-2.5-flash';
    const hasStyle = !!referenceImage;
    const hasDraft = userDraft.trim() !== '';
    const controlSchema = buildControlSchema();

    let scenarioDescription = '';
    if (hasDraft && hasStyle) scenarioDescription = `**Scenario 1 (Full Input):** REFINE the user's idea by combining their draft prompt and the style reference into 3 professional, polished versions.`;
    else if (!hasDraft && hasStyle) scenarioDescription = `**Scenario 2 (Product + Style):** MERGE the product and style by proposing 3 creative ideas that professionally apply the style reference to the product.`;
    else if (hasDraft && !hasStyle) scenarioDescription = `**Scenario 3 (Product + Text):** ENHANCE the user's idea by making their draft prompt 3x more professional and realistic for that specific product.`;
    else scenarioDescription = `**Scenario 4 (Product Only):** INVENT 3 distinct, professional, and suitable advertising concepts for the product (e.g., one minimalist, one cinematic, one in-context).`;

    const prompt = `You are an expert Art Director. Your goal is to generate 3 distinct creative concepts for a product photoshoot.

**Analysis Phase:**
1.  **Analyze Product Image [Image 1]:** Identify the main subject.
2.  **Analyze Style Reference [Image 2] (if provided):** Extract key stylistic elements.
3.  **Inputs for Task:**
    *   **Product Image:** [Image 1] (Main subject)
    *   **Style Reference:** ${hasStyle ? '[Image 2]' : 'Not provided'}
    *   **User's Draft Prompt:** ${hasDraft ? `"${userDraft}"` : 'Not provided'}
    *   **Control Schema:** ${JSON.stringify(controlSchema, null, 2)} (Possible options for presets)

**Task:** Based on your analysis and the user's inputs, generate 3 distinct creative concepts. Follow the logic for the current scenario: ${scenarioDescription}

For each of the 3 concepts, you MUST generate four things:
a) A \`concept_title\` (a very short, catchy name for the concept).
b) A \`prompt_text\` (a short, inspiring, and professional creative direction for an image generator).
c) A \`settings_json\` by selecting the best matching preset options for each key from the \`Control Schema\`.
   - For 'Camera' and 'Mockup', select only one option. For others, you can select multiple comma-separated options. Use "None" if no option fits.
d) Suggest detailed, professional values for \`cameraDetails\` and \`lightingDetails\` that align with your concept.

Return these 3 concepts as a JSON list.`;

    const parts: any[] = [{ inlineData: { mimeType: productImage.mimeType, data: productImage.base64 } }];
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
        if (Array.isArray(suggestions)) {
            return suggestions as SuggestionConcept[];
        }
        return [];
    } catch (error) {
        handleGeminiError(error, 'creative suggestion generation');
        return [];
    }
};

const buildFinalPrompt = (
    finalPrompt: string,
    finalSettings: ChosenSettings,
    exportSettings: ExportSettings,
    hasReferenceImage: boolean
): string => {
    const sections: string[] = [
        "You are an expert AI Art Director. Your task is to create a single, professional, photorealistic product photograph by intelligently synthesizing multiple inputs.",
        `**Core Task:**\nGenerate one final image with a strict aspect ratio of ${exportSettings.aspectRatio}.`,
        "**Analysis & Synthesis Instructions:**",
        "1. **Analyze the Primary Subject Image:** This image contains the product that MUST be the hero of the final shot. Identify the product and its key features.",
    ];

    if (hasReferenceImage) {
        sections.push("2. **Analyze the Style Reference Image:** This image is your primary inspiration for mood, color palette, lighting, and environment. Extract its essence.");
    }

    sections.push(
        `3. **Interpret the Creative Direction (Text Prompt):** The user's prompt is "${finalPrompt}". This is the central creative goal.`,
        "4. **Apply Technical Specifications (Presets & Details):** Use the following settings as professional guidelines to refine the final image:"
    );
    
    const specList: string[] = [];
    if (finalSettings.Mockup !== 'None' && finalSettings.Mockup !== 'None (Plain Backdrop)') {
        specList.push(`- **Scene/Mockup:** ${finalSettings.Mockup}`);
    } else {
        specList.push("- **Scene/Mockup:** A clean, professional studio backdrop that complements the product.");
    }
    if (finalSettings.Camera !== 'None') specList.push(`- **Camera Preset:** ${finalSettings.Camera}`);
    if (finalSettings.cameraDetails) {
        const { focalLength, aperture, shutterSpeed, height, pitch, roll } = finalSettings.cameraDetails;
        specList.push(`- **Camera Details:** ${focalLength}mm lens, f/${aperture}, 1/${shutterSpeed}s, ${height}cm height, ${pitch}° pitch, ${roll}° roll.`);
    }

    if (finalSettings.Lighting !== 'None') specList.push(`- **Lighting Preset:** ${finalSettings.Lighting}`);
     if (finalSettings.lightingDetails) {
        const { temperature, intensity, hardness } = finalSettings.lightingDetails;
        specList.push(`- **Lighting Details:** ${temperature}K temp, ${intensity}% intensity, ${hardness}% hardness.`);
    }

    if (finalSettings.Manipulation !== 'None') specList.push(`- **Advanced Manipulations:** ${finalSettings.Manipulation}`);
    if (finalSettings['Product Retouch'] !== 'None') specList.push(`- **Product Retouching:** ${finalSettings['Product Retouch']}`);
    if (finalSettings['People Retouch'] !== 'None') specList.push(`- **People Retouching (if applicable):** ${finalSettings['People Retouch']}`);

    sections.push(specList.join('\n'));

    sections.push(
        "**Final Output Requirement:**\nCombine your analysis of the images, the user's prompt, and the technical specifications to create one cohesive, stunning, and photorealistic product photograph. The result should look like it was shot by a professional photographer.",
        exportSettings.transparent ? "The final image MUST have a transparent background and be a PNG." : "The background should be fully rendered and opaque."
    );

    return sections.join('\n\n').trim();
};


export const generateFinalImage = async (
    productImage: ImageFile,
    referenceImage: ImageFile | null,
    finalPrompt: string,
    finalSettings: ChosenSettings,
    exportSettings: ExportSettings
): Promise<{ base64: string; mimeType: string } | null> => {
    const model = 'gemini-2.5-flash-image';
    
    // Use the new prompt builder
    const artistPrompt = buildFinalPrompt(finalPrompt, finalSettings, exportSettings, !!referenceImage);

    const parts: any[] = [
        { text: artistPrompt }, // Text prompt should come first for some models
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

        // Add a more robust check for safety issues
        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
             console.error("Image generation stopped for reason:", response.candidates[0].finishReason, response);
             throw new Error(`Image generation was blocked by the AI. Reason: ${response.candidates[0].finishReason}. Please try a different prompt or image.`);
        }
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const mimeType = exportSettings.transparent ? 'image/png' : part.inlineData.mimeType;
                return { base64: part.inlineData.data, mimeType };
            }
        }
        
        console.error("No image found in Gemini response or response was blocked.", response);
        throw new Error("Generation succeeded, but the AI did not return an image. This might be due to a safety filter or an issue with the prompt.");
    } catch (error) {
        // The handleGeminiError function will catch and re-throw the specific errors from above.
        handleGeminiError(error, 'final image generation');
        return null;
    }
};

export const analyzePortraitSubject = async (
    image: ImageFile
): Promise<AiAnalysisReport> => {
    const model = 'gemini-2.5-flash';
    const prompt = `Analyze the provided portrait image for professional retouching.
**Task:** Identify key characteristics of the subject and the photo's quality.

**Analysis Categories:**
1.  **Profile:** Classify the main subject into ONE of the following: "male", "female", "child", "senior". If it's a group photo, use "group". If it's not a person, use "off".
2.  **Age Estimation:** Provide a general age range (e.g., "Toddler", "Teenager", "Young Adult", "Middle-Aged", "Senior Citizen").
3.  **Lighting Quality:** Describe the lighting (e.g., "Professional Studio Light", "Harsh Sunlight", "Soft Window Light", "Low Light / Noisy", "Evenly Lit").
4.  **Focus Quality:** Describe the focus (e.g., "Sharp", "Slightly Soft", "Blurry", "Motion Blur").
5.  **Key Observations:** List up to 3 brief, critical observations relevant to retouching (e.g., "Wearing glasses", "Noticeable skin blemishes", "Flyaway hairs present", "Clothing has wrinkles", "Strong backlighting").

**Output:** Return the analysis as a single, clean JSON object with the keys "profile", "age_estimation", "lighting_quality", "focus_quality", and "key_observations" (as an array of strings).`;

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
        const analysis = JSON.parse(jsonText);
        return analysis as AiAnalysisReport;
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
        // If profile is off, return the original image to show no effect
        return { base64: image.base64, mimeType: image.mimeType };
    }

    // Helper to convert a numeric setting into a qualitative term.
    const getIntensity = (value: number): string => {
        if (value > 70) return 'strong';
        if (value > 30) return 'noticeable';
        return 'subtle';
    };

    const promptLines = [
        "Task: Professionally retouch and enhance the provided portrait. The output must be a photorealistic image of the same person with improved quality. CRITICAL CONSTRAINT: You must preserve the subject's identity. Do not change their facial structure, eye shape, nose, or unique features. This is for enhancement only, like a filter, not generation.",
    ];

    if (customPrompt && customPrompt.trim() !== '') {
        promptLines.push(`\n**User's Creative Direction:** "${customPrompt}". Use this text to guide the retouching, understand nuances (like 'fix stray hairs'), and apply advanced effects (like 'add soft glow'). These instructions are the primary goal.`);
    }

    promptLines.push(`\n**AI Profile & Technical Settings:** The following settings provide a baseline. The user's text prompt should guide how these are applied or potentially override them.`);


    switch (profile) {
        case 'male':
            promptLines.push("\nStyle: Masculine, sharp, and realistic. Enhance definition and texture.");
            if (settings.blemishRemoval) promptLines.push("- Remove temporary blemishes like acne, but preserve all natural skin texture, pores, and scars.");
            promptLines.push("- If facial hair (stubble, beard) is present, sharpen and define it. If the subject is clean-shaven, ensure the skin remains smooth in that area.");
            if (settings.jawSculpt > 0) promptLines.push(`- Add ${getIntensity(settings.jawSculpt)} definition to the jawline and brow.`);
            if (settings.darkCircleReduction > 0) promptLines.push(`- Subtly reduce dark circles under the eyes.`);
            if (settings.skinSmoothing > 0) promptLines.push(`- Even out skin color tone with very subtle smoothing, avoiding any blur.`);
            break;
        case 'female':
            promptLines.push("\nStyle: Clean, aesthetic, and glowing. Create a polished, professional look.");
            if (settings.skinSmoothing > 0) promptLines.push(`- Create smooth skin with a ${getIntensity(settings.skinSmoothing)} effect, evening out skin tone.`);
            if (settings.skinTexture > 0) promptLines.push("- Re-introduce natural-looking skin texture to avoid a plastic look.");
            if (settings.eyeEnhancement) promptLines.push("- Enhance makeup, brighten eyes, and gently reduce dark circles.");
            if (settings.jawSculpt > 0 || settings.noseSculpt > 0) promptLines.push("- Subtly sculpt and refine facial contours.");
            if (settings.blemishRemoval) promptLines.push("- Remove blemishes, spots, and distracting flyaway hairs.");
            break;
        case 'child':
            promptLines.push("\nStyle: Natural and clean. Apply only minimal, subtle corrections.");
            if (settings.lightingCorrection) promptLines.push("- Correct any poor lighting and unnatural color casts on the skin.");
            if (settings.blemishRemoval) promptLines.push("- Clean up minor, non-permanent marks like food stains or dirt.");
            promptLines.push("- Do not apply any skin smoothing, facial sculpting, or eye enhancement.");
            break;
        case 'senior':
            promptLines.push("\nStyle: Dignified, natural, and sharp. Enhance clarity while maintaining a realistic and age-appropriate appearance.");
            if (settings.wrinkleReduction > 0) promptLines.push(`- ${getIntensity(settings.wrinkleReduction)} reduction of deep wrinkles, but do not remove them. Preserve character lines.`);
            if (settings.skinTexture > 0) promptLines.push("- Emphasize natural skin texture, avoiding any overly smooth or artificial look.");
            if (settings.eyeEnhancement) promptLines.push("- Brighten and add clarity to the eyes to make them stand out.");
            if (settings.blemishRemoval) promptLines.push("- Remove temporary age spots or discoloration, but keep defining features like moles.");
            if (settings.hairShineEnhancement > 0) promptLines.push("- Add a healthy shine to hair, whether it's grey or colored.");
            break;
        case 'professional':
            promptLines.push("\nStyle: Corporate headshot. Clean, confident, and professional. The subject should look competent and approachable.");
            if (settings.shineRemoval > 0) promptLines.push(`- ${getIntensity(settings.shineRemoval)} reduction of skin shine/oiliness, especially on the forehead and nose, for a matte finish.`);
            if (settings.clothingWrinkleRemoval) promptLines.push("- Critical: Remove all wrinkles and lint from clothing (e.g., shirt collar, blazer).");
            if (settings.eyeEnhancement) promptLines.push("- Ensure eyes are bright, engaging, and in sharp focus.");
            if (settings.teethWhitening > 0) promptLines.push(`- Apply ${getIntensity(settings.teethWhitening)} teeth whitening for a clean smile.`);
            if (settings.backgroundEnhancement !== 'keep') promptLines.push("- The background should be clean and non-distracting, often a neutral studio backdrop or a subtly blurred office environment.");
            break;
        case 'glamour':
            promptLines.push("\nStyle: High-fashion / beauty magazine. Flawless, sculpted, and dramatic. The result should be highly stylized and idealized.");
            if (settings.skinSmoothing > 0) promptLines.push(`- Apply ${getIntensity(settings.skinSmoothing)} skin smoothing for a porcelain-like finish.`);
            if (settings.jawSculpt > 0 || settings.noseSculpt > 0) promptLines.push("- Perform noticeable facial contouring (dodge & burn style) to sculpt the jawline, cheekbones, and nose.");
            if (settings.eyeEnhancement) promptLines.push("- Dramatically enhance the eyes: brighten the sclera, intensify iris color, and define eyelashes/eyeliner.");
            if (settings.hairShineEnhancement > 0) promptLines.push(`- Add a strong, healthy shine and volume to the hair.`);
            if (settings.colorGrading !== 'none') promptLines.push(`- Apply a strong, cinematic or stylized color grade to fit the high-fashion mood.`);
            break;
    }

    // Common settings for applicable profiles
    if (profile !== 'child') {
        if (settings.flyawayHairRemoval > 0) promptLines.push(`- Tame flyaway hairs with a ${getIntensity(settings.flyawayHairRemoval)} effect.`);
        if (settings.clothingWrinkleRemoval) promptLines.push("- Remove distracting wrinkles from clothing.");
    }

    // Background and Effects
    promptLines.push("\nFinal Touches:");
    switch (settings.backgroundEnhancement) {
        case 'blur': promptLines.push("- Apply a soft, realistic bokeh blur to the background."); break;
        case 'desaturate': promptLines.push("- Subtly desaturate the background colors."); break;
        case 'replace': promptLines.push(`- Replace the background with: "${settings.backgroundReplacementPrompt || 'a neutral studio backdrop'}".`); break;
        default: promptLines.push("- Keep the original background."); break;
    }
    if (settings.colorGrading !== 'none') {
        promptLines.push(`- Apply a professional ${settings.colorGrading} color grade.`);
    }
    if (settings.filmGrain > 0) {
        promptLines.push(`- Add ${getIntensity(settings.filmGrain)} film grain for a cinematic feel.`);
    }
    
    const fullPrompt = promptLines.join('\n');
    const parts = [{ text: fullPrompt }, { inlineData: { data: image.base64, mimeType: image.mimeType } }];

    try {
        const response = await genAI.models.generateContent({
            model,
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
             console.error("Retouch stopped for reason:", response.candidates[0].finishReason, response);
             throw new Error(`Image retouching was blocked. Reason: ${response.candidates[0].finishReason}.`);
        }
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return { base64: part.inlineData.data, mimeType: 'image/jpeg' };
            }
        }
        
        throw new Error("Retouching succeeded, but the AI did not return an image.");
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
    const imagePart = { inlineData: { data: baseImage.base64, mimeType: baseImage.mimeType } };
    
    let upscalePrompt: string;
    if (target === '4k') {
        upscalePrompt = `Perform a professional-grade super-resolution upscale to a 4K resolution (~4096px on the longest side). The primary goal is maximum detail preservation and clarity. Subtly enhance fine details and textures like fabric weaves or brushed metal without introducing artifacts, noise, or blurring. Maintain perfect color fidelity and lighting from the original image. This is a technical upscaling task; do not alter the style, composition, or content. Output only the upscaled image.`;
    } else { // 'hd'
        upscalePrompt = `Upscale this image to a high-definition resolution (~2K). Preserve all original details and textures perfectly, avoiding any blurring or artifacts. Do not alter the style or content. Output only the upscaled image.`;
    }

    const textPart = { text: upscalePrompt };

    try {
        const response = await genAI.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        // Add a more robust check for safety issues
        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
             console.error("Upscale stopped for reason:", response.candidates[0].finishReason, response);
             throw new Error(`Image upscaling was blocked by the AI. Reason: ${response.candidates[0].finishReason}.`);
        }
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
            }
        }
        
        console.error("No image found in upscale response.", response);
        // Throw an error that will be caught and handled
        throw new Error("Upscaling succeeded, but the AI did not return an image.");
    } catch (error) {
        handleGeminiError(error, 'image upscaling');
        return null;
    }
};
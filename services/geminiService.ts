import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ImageFile, UpscaleTarget, ChosenSettings, SuggestionConcept, ExportSettings, AspectRatio } from '../types';
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

export const generateImageWithImagen = async (
    prompt: string,
    negativePrompt: string,
    exportSettings: ExportSettings
): Promise<{ base64: string; mimeType: string } | null> => {
    const model = 'imagen-4.0-generate-001';
    
    // Construct the prompt. The pipe and "negative prompt:" are common conventions.
    const fullPrompt = negativePrompt ? `${prompt} | negative prompt: ${negativePrompt}` : prompt;

    try {
        const response = await genAI.models.generateImages({
            model,
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: exportSettings.aspectRatio as '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const imageData = response.generatedImages[0].image;
            return { base64: imageData.imageBytes, mimeType: imageData.mimeType || 'image/jpeg' };
        }

        console.error("No image found in Imagen response.", response);
        throw new Error("Generation succeeded, but the AI did not return an image.");

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
    if (hasDraft && hasStyle) {
        scenarioDescription = `**Scenario 1 (Full Input):** REFINE the user's idea by combining their draft prompt and the style reference into 3 professional, polished versions.`;
    } else if (!hasDraft && hasStyle) {
        scenarioDescription = `**Scenario 2 (Product + Style):** MERGE the product and style by proposing 3 creative ideas that professionally apply the style reference to the product.`;
    } else if (hasDraft && !hasStyle) {
        scenarioDescription = `**Scenario 3 (Product + Text):** ENHANCE the user's idea by making their draft prompt 3x more professional and realistic for that specific product.`;
    } else { // !hasDraft && !hasStyle
        scenarioDescription = `**Scenario 4 (Product Only):** INVENT 3 distinct, professional, and suitable advertising concepts for the product (e.g., one minimalist, one cinematic, one in-context).`;
    }

    const prompt = `You are an expert Art Director. Your goal is to generate 3 distinct creative concepts for a product photoshoot.

**Analysis Phase:**
1.  **Analyze Product Image [Image 1]:** Identify the main subject.
2.  **Analyze Style Reference [Image 2] (if provided):** Extract key stylistic elements:
    *   \`scene_environment\`: e.g., "on a marble podium", "in a dark forest", "on a sandy beach".
    *   \`lighting_conditions\`: e.g., "dramatic morning light", "soft studio lighting", "cinematic sunset glow".
    *   \`mood_atmosphere\`: e.g., "luxurious and minimal", "moody and dark", "vibrant and energetic".
    *   \`composition_angles\`: e.g., "low-angle shot", "top-down flatlay".

**Inputs for Task:**
1.  **Product Image:** [Image 1] (Main subject)
2.  **Style Reference:** ${hasStyle ? '[Image 2]' : 'Not provided'} (Desired mood/style)
3.  **User's Draft Prompt:** ${hasDraft ? `"${userDraft}"` : 'Not provided'} (Initial idea)
4.  **Control Schema:** ${JSON.stringify(controlSchema, null, 2)} (Possible options for settings)

**Task:** Based on your analysis and the user's inputs, generate 3 distinct creative concepts. Follow the logic for the current scenario: ${scenarioDescription}

For each of the 3 concepts, you MUST generate three things:
a) A \`concept_title\` (a very short, catchy name for the concept, e.g., "Minimalist Elegance", "Cinematic Drama").
b) A \`prompt_text\` (a short, inspiring, and professional creative direction for an image generator that synthesizes your analysis with the user's goal).
c) A \`settings_json\` by selecting the best matching options for each key from the \`Control Schema\`.
   - For 'Camera' and 'Mockup', select only one option.
   - For 'Lighting', 'Manipulation', 'Product Retouch', and 'People Retouch', you may select multiple suitable options as a comma-separated string.
   - If no option fits, use "None".

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
                                },
                                required: ["Camera", "Lighting", "Mockup", "Manipulation", "Product Retouch", "People Retouch"]
                            }
                        },
                        required: ["concept_title", "prompt_text", "settings_json"]
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
    const settingStrings: string[] = [];

    // Prioritize the aspect ratio instruction by placing it first and making it a direct command.
    let coreInstruction = `Generate a single, professional, photorealistic product photograph with a strict aspect ratio of ${exportSettings.aspectRatio}.`;

    // Add the main creative direction.
    coreInstruction += ` The primary creative goal is: "${finalPrompt}".`;
    
    // Add context about style source (reference image vs. settings).
    if (hasReferenceImage) {
        coreInstruction += ` The overall visual style, mood, environment, and color palette MUST be heavily inspired by the provided style reference image.`;
    }

    // Describe the scene/mockup first if it's not a plain backdrop
    if (finalSettings.Mockup !== 'None' && finalSettings.Mockup !== 'None (Plain Backdrop)') {
        settingStrings.push(`Place the product in a scene resembling a ${finalSettings.Mockup.toLowerCase()}.`);
    }

    // Add other settings as supporting details.
    if (finalSettings.Camera !== 'None') settingStrings.push(`Use a '${finalSettings.Camera}' camera angle and style.`);
    if (finalSettings.Lighting !== 'None') settingStrings.push(`The lighting should be '${finalSettings.Lighting}'.`);
    if (finalSettings.Manipulation !== 'None') settingStrings.push(`Apply manipulations like: ${finalSettings.Manipulation}.`);
    if (finalSettings['Product Retouch'] !== 'None') settingStrings.push(`Retouch the product for: ${finalSettings['Product Retouch']}.`);
    if (finalSettings['People Retouch'] !== 'None') settingStrings.push(`If people are present, retouch them for: ${finalSettings['People Retouch']}.`);
    
    const fullPrompt = [
        coreInstruction,
        ...settingStrings,
        exportSettings.transparent ? "The final image MUST have a transparent background and be a PNG." : "The background should be fully rendered and opaque."
    ].join(' ').replace(/\s+/g, ' ').trim();
    
    return fullPrompt;
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
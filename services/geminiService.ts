
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiModel } from '../types';

// Initialize the client. API Key must be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFastResponse = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.FLASH_LITE,
      contents: prompt,
    });
    return response.text || "无法获取回复";
  } catch (error) {
    console.error("Gemini Fast Error:", error);
    return "AI 服务暂时不可用。";
  }
};

export const getThinkingResponse = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.PRO_PREVIEW,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max budget for reasoning
      }
    });
    return response.text || "思考中出现问题";
  } catch (error) {
    console.error("Gemini Thinking Error:", error);
    return "深度思考服务暂时不可用。";
  }
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.PRO_PREVIEW, // Using Pro for better understanding of historical docs
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      }
    });
    return response.text || "无法分析图片";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "图片分析服务暂时不可用。";
  }
};

export const editImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    // Note: In a real scenario with @google/genai, editing might use generateImages or specific edit endpoints
    // For this demo, we simulate the "Nano Banana" editing by asking Flash Image to generate a new image based on input
    // This strictly follows the pattern of sending image + text to an image model if it supports editing, 
    // or using the generateContent to describe edits.
    // However, specifically for "Nano banana powered app" request: 
    // "use text prompts to edit images using Gemini 2.5 Flash Image"
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
           {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: `Edit this image: ${prompt}. Return the image.` }
        ]
      }
    });

    // Check for image in response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
          return part.inlineData.data;
       }
    }
    return null;
  } catch (error) {
    console.error("Image Edit Error", error);
    return null;
  }
}

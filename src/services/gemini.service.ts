
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { Character } from '../models/character.model';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  private readonly CATEGORIES = "action, adventure, anime, comedy, DILF, dominant, drama, education, events, fantasy, femboy, furry, futanari, gaming, female, male, giant, kemono,kuudere, MILF, monsters, non-binary, NTR, original character, pov female, pov male, pov neutral, robot, roleplay, scenario, sci-fi, steampunk, submissive, suspense, tomboys, tsundere, vampire, vtubers, Yandere, yaoi, yuri";

  async analyzeImageForTheme(imageData: { data: string, mimeType: string }): Promise<string> {
    const imagePart = {
      inlineData: {
        mimeType: imageData.mimeType,
        data: imageData.data,
      },
    };
    const textPart = {
      text: "Analyze this image and describe a potential character based on it. Focus on their appearance, the mood of the image, their likely personality, and a potential one-sentence story concept. The description should be suitable as a creative prompt for generating a full character profile."
    };
    
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
      });
      return response.text.trim();
    } catch (error) {
      console.error("Error analyzing image:", error);
      throw new Error("Failed to analyze image.");
    }
  }

  async generateCharacter(theme: string, image: { data: string, mimeType: string } | null, additionalInstructions: string): Promise<Character> {
    const promptIntro = image 
      ? `You are an expert character designer for AI chatbots. Based on the following theme AND the provided image, create a complete character profile. Use the image as the primary visual reference.`
      : `You are an expert character designer for AI chatbots. Based on the following theme, create a complete character profile.`;
      
    const instructions = additionalInstructions 
      ? `\nAdditionally, adhere to these specific instructions: "${additionalInstructions}"`
      : '';
      
    const prompt = `${promptIntro}
The theme is: "${theme}".
Please generate all the required fields in the provided JSON schema. Be creative, detailed, and consistent.

**Field Instructions:**
- **title**: A catchy, interesting headline for the character card to attract users. Can be a nickname, a theme, or a short phrase.
- **first_message**: Must include narrative parts in asterisks (*narrative*) and spoken dialogue in quotes ("dialogue"). You MUST use '{{user}}' to refer to the user.
- **categories**: Choose up to 7 relevant tags from this list: ${this.CATEGORIES}.
- **image_prompt**: A detailed prompt for an AI image generator.
- **NAME PLACEHOLDER**: In ALL text fields that might reference the character's name (like title, description, background_story, first_message, scenario, example_dialogue), you MUST use the placeholder '{{char}}' instead of a specific name from your suggestions.
${instructions}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A catchy, interesting headline for the character card to attract users. Can be a nickname, a theme, or a short phrase. Must use {{char}} if the name is mentioned." },
        name: { type: Type.STRING, description: "A list of 3-5 recommended names suitable for the character, separated by commas." },
        description: { type: Type.STRING, description: "A concise summary of the character's core concept and appeal. Must use {{char}} for the character's name." },
        persona: {
          type: Type.OBJECT,
          properties: {
            background_story: { type: Type.STRING, description: "A detailed background story for the character. Must use {{char}} for the character's name." },
            appearance: {
              type: Type.OBJECT,
              properties: {
                hair: { type: Type.STRING },
                eye: { type: Type.STRING },
                body: { type: Type.STRING },
                clothes: { type: Type.STRING },
                accessories: { type: Type.STRING }
              },
              required: ["hair", "eye", "body", "clothes", "accessories"]
            },
            personality: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of key personality traits (e.g., 'charming', 'mysterious')."
            }
          },
          required: ["background_story", "appearance", "personality"]
        },
        first_message: { type: Type.STRING, description: "The character's first message to the user, including narrative and dialogue. Must include '{{user}}' and use {{char}} for the character's name." },
        scenario: { type: Type.STRING, description: "The world description or story scene where the character exists. Must use {{char}} for the character's name." },
        example_dialogue: { type: Type.STRING, description: "An example dialogue interaction to showcase the character's style. Must use {{char}} for the character's name." },
        image_prompt: { type: Type.STRING, description: "A detailed, descriptive prompt for an AI image generator (like Midjourney or DALL-E) to create a cover image of the character. Include details on appearance, clothing, setting, mood, style, and composition." },
        custom_tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of 3-5 custom, descriptive tags for the character."
        },
        categories: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `A list of up to 7 relevant categories chosen from the provided list.`
        }
      },
      required: ["title", "name", "description", "persona", "first_message", "scenario", "example_dialogue", "image_prompt", "custom_tags", "categories"]
    };

    const imagePart = image ? {
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    } : null;
    
    const textPart = { text: prompt };

    const contents = imagePart ? { parts: [textPart, imagePart] } : prompt;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.8,
        },
      });

      const jsonText = response.text.trim();
      return JSON.parse(jsonText) as Character;
    } catch (error) {
      console.error("Error generating character:", error);
      throw new Error("Failed to generate character. Please check the API key and try again.");
    }
  }
}

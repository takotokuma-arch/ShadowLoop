import { GoogleGenerativeAI } from "@google/generative-ai";

export async function validateApiKey(apiKey: string): Promise<boolean> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        // Minimal check: count tokens of a simple string. 
        // This verifies the key is valid and has access to the model.
        await model.countTokens("Test");
        return true;
    } catch (error) {
        console.error("API Key validation failed", error);
        return false;
    }
}

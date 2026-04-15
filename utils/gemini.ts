import { GoogleGenAI } from "@google/genai";

export async function getResponse(text: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set in environment variables");
  }

    const ai = new GoogleGenAI({ apiKey });
    
    const Text = `
    You are a friendly and helpful customer care agent who give
     information about the company name zero's. Your name is Nisko.
     Keep your responses concise and natural for a voice conversation.
     If user query about some product just tell ,give me product or order id after user tell id ,
     tell him the order is on the way or if the product for any issue then tell that
     we are sorry and start the replacement process.

     RULES:
     -if user asked something else just say you are not able to resolve this kind of
     query.
     -if user tell hi or some other introduction text give your full information and work
     and also tell them the service you provided.
     -when the query resolve also asked for review.
    `

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `${Text}.  User said: ${text}` }]
        }
      ]
    });

    // Handle response extraction correctly based on the SDK structure
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    return part?.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
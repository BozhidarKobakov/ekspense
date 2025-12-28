import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// This service handles AI interactions.
export const generateSpendingInsights = async (transactions: Transaction[], monthStr: string) => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided for Gemini");
    return "API Key missing. Please configure your environment to use AI features.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert transactions to a simplified string format for the model
  const dataStr = JSON.stringify(transactions.map(t => ({
    date: t.date.toDateString(),
    desc: t.description,
    cat: t.category,
    amount: t.amount,
  })));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a financial advisor assistant for the user's personal expense tracker app "EKSPENCE".
      
      Here is the raw expense data for ${monthStr}:
      ${dataStr}

      Please provide:
      1. A short, encouraging summary of their spending behavior this month.
      2. Identify the single biggest money drain (Category or Merchant).
      3. Three specific, actionable bullet points on how to save money next month based *specifically* on this data.
      
      Keep the tone friendly, professional, and concise. Do not use markdown headers like ##. Use bullet points for the tips.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error", error);
    return "I'm having trouble analyzing your data right now. Please try again later.";
  }
};
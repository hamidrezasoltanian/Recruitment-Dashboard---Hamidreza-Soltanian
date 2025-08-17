import { GoogleGenAI } from "@google/genai";

export const aiService = {
  async generateTemplateContent(prompt: string): Promise<string> {
    try {
      // The build process ensures process.env.API_KEY is available.
      // A check here provides a graceful failure if the key is missing at runtime.
      if (!process.env.API_KEY) {
        throw new Error('کلید API برای Gemini تنظیم نشده است.');
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert HR assistant. Your task is to generate professional and friendly communication templates (emails or WhatsApp messages) for a recruitment process. The language must be Persian. Keep the tone appropriate for communicating with candidates. Use placeholders like {{candidateName}}, {{position}}, {{interviewDate}}, {{interviewTime}}, {{companyName}}, {{companyAddress}}, {{companyWebsite}}, {{stageName}} where appropriate.',
        }
      });
      
      const text = response.text;
      if (!text) {
          throw new Error('پاسخی از سرویس هوش مصنوعی دریافت نشد.');
      }

      return text;

    } catch (error) {
      console.error("Error generating content with AI:", error);
      // Provide a user-friendly error message
      if (error instanceof Error) {
        throw new Error(`خطا در ارتباط با سرویس هوش مصنوعی: ${error.message}`);
      }
      throw new Error('خطا در ارتباط با سرویس هوش مصنوعی. لطفاً از فعال بودن کلید API و اتصال اینترنت اطمینان حاصل کنید.');
    }
  },
};

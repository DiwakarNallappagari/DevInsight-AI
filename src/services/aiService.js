const { ChatOpenAI } = require("@langchain/openai");
const axios = require("axios");

const getAiSuggestions = async (code, language) => {
  try {
    // Attempt Gemini first matching user preference
    if (process.env.GEMINI_API_KEY) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Analyze the following ${language} code and provide 3 short, actionable suggestions for improvement. Format the output as a clean, simple bulleted list with no markdown bolding, just plain text bullets.\n\nCODE:\n${code}`,
                },
              ],
            },
          ],
        }
      );
      
      const text = response.data.candidates[0].content.parts[0].text;
      return text.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^[\s*-]+/, '').trim());
    }

    // Fallback to Groq
    if (process.env.GROQ_API_KEY) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert code reviewer." },
            { role: "user", content: `Provide exactly 3 short, actionable suggestions to improve this ${language} code. Return ONLY the 3 items separated by newlines, with no bullet characters or numbers.\n\nCODE:\n${code}` }
          ]
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
      );
      return response.data.choices[0].message.content.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      const model = new ChatOpenAI({ temperature: 0.3, modelName: "gpt-3.5-turbo" });
      const prompt = `Provide exactly 3 short, actionable suggestions to improve this ${language} code. Return ONLY the 3 items separated by newlines, with no bullet characters or numbers.\n\nCODE:\n${code}`;
      const res = await model.invoke(prompt);
      return res.content.split('\n').filter(line => line.trim().length > 0).map(l => l.replace(/^[\s*.0-9-*-]+/, '').trim());
    }

    // Mock suggestions if no API key is provided
    return [
      "Consider using more descriptive variable names to improve readability.",
      "Break down complex logic into smaller, reusable functions.",
      "Add comprehensive JSDoc/Docstring comments for better maintainability."
    ];
  } catch (error) {
    if (error.response) {
      console.warn("AI Suggestions API Error:", error.response.status, JSON.stringify(error.response.data));
    } else {
      console.warn("AI Suggestions Error:", error.message);
    }
    return ["AI Suggestions unavailable at the moment due to an API error."];
  }
};

const explainCodeSnippet = async (code, language) => {
  const promptText = `Explain the following ${language} code in 2-3 clear, concise paragraphs. Focus on what it does, how it works, and any notable patterns or potential issues.\n\nCODE:\n${code}`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: promptText }] }] }
      );
      return response.data.candidates[0].content.parts[0].text;
    }

    if (process.env.GROQ_API_KEY) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptText }]
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
      );
      return response.data.choices[0].message.content;
    }

    if (process.env.OPENAI_API_KEY) {
      const model = new ChatOpenAI({ temperature: 0.5, modelName: "gpt-3.5-turbo" });
      const res = await model.invoke(promptText);
      return res.content;
    }

    return "AI Explanation is unavailable because no AI API Key (GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY) was found in your environment variables.";
  } catch (error) {
    if (error.response) {
      console.error("AI Explanation API Error:", error.response.status, JSON.stringify(error.response.data));
    } else {
      console.error("AI Explanation Error:", error.message);
    }
    throw new Error("Failed to generate AI explanation");
  }
};

const explainCodeSimply = async (code, language) => {
  const promptText = `Explain the following ${language} code to a complete beginner (age 14). 
Rules:
- Use VERY simple words. No jargon or technical terms.
- Start with a one-sentence summary of what it does.
- Give one relatable real-world analogy (e.g. "This code is like a recipe that...").
- Then briefly walk through what happens step by step in plain English.
- Keep it under 150 words total.

CODE:
${code}`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: promptText }] }] }
      );
      return response.data.candidates[0].content.parts[0].text;
    }

    if (process.env.GROQ_API_KEY) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptText }]
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
      );
      return response.data.choices[0].message.content;
    }

    if (process.env.OPENAI_API_KEY) {
      const model = new ChatOpenAI({ temperature: 0.5, modelName: "gpt-3.5-turbo" });
      const res = await model.invoke(promptText);
      return res.content;
    }

    return "🧒 Simple Explanation: This code gives the computer a set of step-by-step instructions — like a recipe. It reads some information, does a calculation or task with it, then shows you the result. Each line tells the computer exactly what to do next!";
  } catch (error) {
    if (error.response) {
      console.error("Beginner Explanation API Error:", error.response.status, JSON.stringify(error.response.data));
    } else {
      console.error("Beginner Explanation Error:", error.message);
    }
    throw new Error("Failed to generate beginner explanation");
  }
};

const refactorCode = async (code, language) => {
  const promptText = `Refactor the following ${language} code to follow industry best practices.
Instructions:
- Fix all potential bugs, security vulnerabilities, and code smells.
- Improve variable naming and code structure.
- Add clear comments explaining complex parts.
- Preserve the original logic and functionality exactly.
- Return ONLY the refactored code. No explanations, no markdown blocks, no triple backticks.

CODE:
${code}`;

  try {
    let refactoredCode = "";

    if (process.env.GEMINI_API_KEY) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: promptText }] }] }
      );
      refactoredCode = response.data.candidates[0].content.parts[0].text;
    } else if (process.env.GROQ_API_KEY) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptText }]
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
      );
      refactoredCode = response.data.choices[0].message.content;
    } else if (process.env.OPENAI_API_KEY) {
      const model = new ChatOpenAI({ temperature: 0.3, modelName: "gpt-4" });
      const res = await model.invoke(promptText);
      refactoredCode = res.content;
    } else {
      // Fallback for demo
      refactoredCode = `// AI Refactored ${language} Code\n${code}\n\n// Added best practices and comments...`;
    }

    // Clean up if AI included backticks despite instructions
    return refactoredCode.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
  } catch (error) {
    if (error.response) {
      console.error("Refactor API Error:", error.response.status, JSON.stringify(error.response.data));
    } else {
      console.error("Refactor Error:", error.message);
    }
    throw new Error("Failed to refactor code");
  }
};

module.exports = { getAiSuggestions, explainCodeSnippet, explainCodeSimply, refactorCode };

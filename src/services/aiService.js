const { ChatOpenAI } = require("@langchain/openai");
const axios = require("axios");

const resolveApiKeys = () => {
  let geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
  let groqKey = process.env.GROQ_API_KEY?.trim() || "";
  let openaiKey = process.env.OPENAI_API_KEY?.trim() || "";

  // Handle Groq key placed in openaiKey
  if (openaiKey && openaiKey.startsWith("gsk_")) {
    if (!groqKey) groqKey = openaiKey;
    openaiKey = "";
  }
  // Handle OpenAI key placed in groqKey
  if (groqKey && (groqKey.startsWith("sk-") || groqKey.startsWith("sk-proj-"))) {
    if (!openaiKey) openaiKey = groqKey;
    groqKey = "";
  }
  
  return { geminiKey, groqKey, openaiKey };
};

const getAiSuggestions = async (code, language) => {
  const { geminiKey, groqKey, openaiKey } = resolveApiKeys();

  try {
    // Attempt Gemini first matching user preference
    if (geminiKey && !geminiKey.includes("your_")) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
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
    if (groqKey && !groqKey.includes("your_")) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert code reviewer." },
            { role: "user", content: `Provide exactly 3 short, actionable suggestions to improve this ${language} code. Return ONLY the 3 items separated by newlines, with no bullet characters or numbers.\n\nCODE:\n${code}` }
          ]
        },
        { headers: { Authorization: `Bearer ${groqKey}` } }
      );
      return response.data.choices[0].message.content.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    }

    // Fallback to OpenAI
    if (openaiKey && !openaiKey.includes("your_")) {
      const model = new ChatOpenAI({ temperature: 0.3, modelName: "gpt-3.5-turbo", openAIApiKey: openaiKey });
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
      console.error("AI Suggestions API Error Detail:", {
        status: error.response.status,
        data: error.response.data,
        config: { url: error.config.url, method: error.config.method }
      });
    } else {
      console.error("AI Suggestions Error:", error.message);
    }
    return ["AI Suggestions unavailable at the moment due to an API error."];
  }
};

const explainCodeSnippet = async (code, language) => {
  const promptText = `Explain the following ${language} code in 2-3 clear, concise paragraphs. Focus on what it does, how it works, and any notable patterns or potential issues.\n\nCODE:\n${code}`;
  const { geminiKey, groqKey, openaiKey } = resolveApiKeys();

  try {
    if (geminiKey && !geminiKey.includes("your_")) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        { contents: [{ parts: [{ text: promptText }] }] }
      );
      return response.data.candidates[0].content.parts[0].text;
    }

    if (groqKey && !groqKey.includes("your_")) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptText }]
        },
        { headers: { Authorization: `Bearer ${groqKey}` } }
      );
      return response.data.choices[0].message.content;
    }

    if (openaiKey && !openaiKey.includes("your_")) {
      const model = new ChatOpenAI({ temperature: 0.5, modelName: "gpt-3.5-turbo", openAIApiKey: openaiKey });
      const res = await model.invoke(promptText);
      return res.content;
    }

    return "AI Explanation is unavailable because no AI API Key (GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY) was found in your environment variables.";
  } catch (error) {
    if (error.response) {
      console.error("AI Explanation Error Detail:", {
        status: error.response.status,
        data: error.response.data,
        msg: error.message
      });
    } else {
      console.error("AI Explanation Error:", error.message);
    }
    throw new Error(`Failed to generate AI explanation: ${error.response?.data?.error?.message || error.message}`);
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

  const { geminiKey, groqKey, openaiKey } = resolveApiKeys();

  try {
    if (geminiKey && !geminiKey.includes("your_")) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        { contents: [{ parts: [{ text: promptText }] }] }
      );
      return response.data.candidates[0].content.parts[0].text;
    }

    if (groqKey && !groqKey.includes("your_")) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptText }]
        },
        { headers: { Authorization: `Bearer ${groqKey}` } }
      );
      return response.data.choices[0].message.content;
    }

    if (openaiKey && !openaiKey.includes("your_")) {
      const model = new ChatOpenAI({ temperature: 0.5, modelName: "gpt-3.5-turbo", openAIApiKey: openaiKey });
      const res = await model.invoke(promptText);
      return res.content;
    }

    return "🧒 Simple Explanation: This code gives the computer a set of step-by-step instructions — like a recipe. It reads some information, does a calculation or task with it, then shows you the result. Each line tells the computer exactly what to do next!";
  } catch (error) {
    if (error.response) {
      console.error("Beginner Explanation Error Detail:", {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error("Beginner Explanation Error:", error.message);
    }
    throw new Error(`Failed to generate beginner explanation: ${error.response?.data?.error?.message || error.message}`);
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

  const { geminiKey, groqKey, openaiKey } = resolveApiKeys();

  try {
    let refactoredCode = "";

    if (geminiKey && !geminiKey.includes("your_")) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        { contents: [{ parts: [{ text: promptText }] }] }
      );
      refactoredCode = response.data.candidates[0].content.parts[0].text;
    } else if (groqKey && !groqKey.includes("your_")) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: promptText }]
        },
        { headers: { Authorization: `Bearer ${groqKey}` } }
      );
      refactoredCode = response.data.choices[0].message.content;
    } else if (openaiKey && !openaiKey.includes("your_")) {
      const model = new ChatOpenAI({ temperature: 0.3, modelName: "gpt-4", openAIApiKey: openaiKey });
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
      console.error("Refactor Error Detail:", {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error("Refactor Error:", error.message);
    }
    throw new Error(`Failed to refactor code: ${error.response?.data?.error?.message || error.message}`);
  }
};

module.exports = { getAiSuggestions, explainCodeSnippet, explainCodeSimply, refactorCode };

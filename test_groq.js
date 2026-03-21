const axios = require('axios');
require('dotenv').config();

const testGroq = async () => {
    const apiKey = process.env.GROQ_API_KEY;
    const model = "llama-3.3-70b-versatile";
    
    console.log("Testing Groq API with key:", apiKey ? "Present" : "Missing");
    console.log("Model:", model);

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: model,
                messages: [
                    { role: "user", content: "Hello, say 'Groq is working' if you can read this." }
                ]
            },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        console.log("Success!");
        console.log("Response:", response.data.choices[0].message.content);
    } catch (error) {
        console.error("Groq API Error:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
};

testGroq();

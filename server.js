const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const openai = new OpenAI({
  apiKey: "PUT_YOUR_API_KEY_HERE",
});

app.post("/analyze-image", async (req, res) => {
  try {
    const { image } = req.body;

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this trading chart screenshot. Give clear feedback about setup, entry quality, risk, mistakes, and improvement suggestions.",
            },
            {
              type: "input_image",
              image_url: image,
            },
          ],
        },
      ],
    });

    res.json({ result: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error analyzing image" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
import { Review } from "../models/Review.models.js";
import groq from "../services/grok.js";

const reviewCode = async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        message: "Language and code are required",
      });
    }

    if (code.trim().length === 0) {
      return res.status(400).json({
        message: "Code cannot be empty",
      });
    }

    const allowedLanguages = [
      "javascript",
      "python",
      "java",
      "cpp",
      "typescript",
      "php",
      "csharp",
    ];

    if (!allowedLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({
        message: "Invalid language selected",
      });
    }

    // prompt for AI review
    const prompt = `
    You are an expert code reviewer.
    Review this ${language} code.
    
    CRITICAL RULES:
    1. Return ONLY raw JSON nothing else
    2. NO extra text before or after JSON
    3. NO markdown backticks or code blocks
    4. NO explanations or descriptions
    5. JUST the JSON object nothing else
    6. ALL arrays must contain ONLY plain strings
    7. NO objects inside arrays
    8. NO {message: "..."} format
    9. NO {code: "...", message: "..."} format
    10. Only plain strings like ["string here"]
    11. Do NOT suggest renaming valid variables
    12. Only report REAL bugs and issues
    13. If no issues found return empty array []
    14. score must be a number between 0 and 10
    15. improvedCode must be a plain string
    
    Return EXACTLY in this format with no deviation:
    {
        "bugs": ["plain string only"],
        "security": ["plain string only"],
        "performance": ["plain string only"],
        "bestPractices": ["plain string only"],
        "score": 7,
        "improvedCode": "improved code here as plain string"
    }
    
    Code to review:
    ${code}
    `;

    // calling groq api
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    });

    // saving raw response for debugging
    const rawResponse = response.choices[0].message.content;

    // cleaning response to extract pure JSON
    const cleanResponse = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)

    if(!jsonMatch) {
        return res.status(500).json({
            message: 'AI returned invalid response please try again'
        })
    }

    // extracting JSON from cleaned response
    
    const parsedReview = JSON.parse(jsonMatch[0])


    // saving review to database
    const newReview = await Review.create({
      userId: req.user._id,
      code,
      language,
      review: parsedReview,
      score: parsedReview.score,
    });

    // returning response
    return res.status(200).json({
      message: "response from AI",
      data: newReview,
    });
  } catch (error) {
    console.log(error);

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        message: "AI returned invalid response please try again",
      });
    }

    // Handle rate limit
    if (error.status === 429) {
      return res.status(429).json({
        message: "Too many requests please try again later",
      });
    }

    return res.status(500).json({
      message: "Server error while reviewing code",
      error: error.message,
    });
  }
};

const getAllReviews = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized User",
      });
    }

    const allReviews = await Review.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    if (allReviews.length === 0) {
      return res.status(404).json({
        message: "no reviews found for this user",
      });
    }

    return res.status(200).json({
      message: "user reviews",
      data: allReviews,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error while fetching reviews",
    });
  }
};

const getSingleReview = async (req, res) => {
  try {
    const singleReview = await Review.findById(req.params.id);

    if (!singleReview) {
      return res.status(404).json({
        message: "review not found",
      });
    }

    if (singleReview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot get reviews of other users",
      });
    }

    return res.status(200).json({
      message: "single review fetched successfully",
      data: singleReview,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error while fetching review",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const singleReview = await Review.findById(req.params.id);

    if (!singleReview) {
      return res.status(404).json({
        message: "review not found",
      });
    }

    if (singleReview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot delete reviews of other users",
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "review deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server Error while deleting review",
    });
  }
};

export { reviewCode, getAllReviews, getSingleReview, deleteReview };

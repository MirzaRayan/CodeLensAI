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

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a code reviewer. 
        You only respond with raw JSON. 
        Never include instructions or rules in your response.
        Only return the JSON object.
        
        IMPORTANT:
        - Do NOT suggest renaming variables that are already clear
        - Do NOT flag simple working code as having issues
        - Only report REAL bugs like syntax errors or crashes
        - Only report REAL security vulnerabilities
        - bestPractices should be empty array for simple correct code
        - A simple console.log or variable declaration has NO best practice issues`,
        },
        {
          role: "user",
          content: `Review this ${language} code and return ONLY a JSON object:
        
        ${code}
        
        JSON format:
        {
          "bugs": [],
          "security": [],
          "performance": [],
          "bestPractices": [],
          "score": 0,
          "improvedCode": ""
        }
        
        Rules:
        - Plain strings only in arrays
        - Empty array if nothing found
        - Simple correct code gets score 8 or above
        - Do NOT suggest renaming valid clear variables
        - Do NOT add best practices for simple working code
        - Only flag CRITICAL issues not style preferences`,
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

    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({
        message: "AI returned invalid response please try again",
      });
    }

    // extracting JSON from cleaned response

    const parsedReview = JSON.parse(jsonMatch[0]);

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

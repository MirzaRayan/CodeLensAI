import { Review } from "../models/Review.models.js";
import groq from "../services/grok.js";

const reviewCode = async (req, res) => {
    try {
        const {language, code} = req.body


        if(!language || !code) {
            return res.status(400).json({
                message: 'Language and code are required'
            })
        }

        if(code.trim().length ===0 ) {
            return res.status(400).json({
                message: 'Code cannot be empty'
            })
        }

        const allowedLanguages = [
            'javascript',
            'python',
            'java',
            'cpp',
            'typescript',
            'php',
            'csharp'
        ]

        if(!allowedLanguages.includes(language.toLowerCase())) {
            return res.status(400).json({
                message: 'Invalid language selected'
            })
        }


        // prompt for AI review
        const prompt = `
        You are an expert code reviewer.
        Review this ${language} code.
        
        IMPORTANT RULES:
        1. If input is not valid code
           set score to 0
           add "Invalid code submitted"
           in bugs array
        
        2. Respond ONLY with valid JSON
           No extra text
           No markdown
           No backticks
        
        Use this EXACT format:
        {
            "bugs": [],
            "security": [],
            "performance": [],
            "bestPractices": [],
            "score": 7,
            "improvedCode": ""
        }
        
        Code to review:
        ${code}
        `


        // calling groq api
        const response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3
        })


        // saving raw response for debugging
        const rawResponse = response.choices[0].message.content


        console.log('Raw response:', rawResponse)

        

        // cleaning response to extract pure JSON
        const cleanResponse = rawResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()


        // extracting JSON from cleaned response
        const parsedReview = JSON.parse(cleanResponse)

        

        // saving review to database
        const newReview = await Review.create({
            userId: req.user._id,
            code,
            language,
            review: parsedReview,
            score: parsedReview.score
        })


        // returning response 
        return res.status(200).json({
            message: 'response from AI',
            data: newReview
        })

      


    } catch (error) {
        console.log(error);

        if(error instanceof SyntaxError) {
            return res.status(500).json({
                message: 'AI returned invalid response please try again'
            })
        }

        // Handle rate limit
        if(error.status === 429) {
            return res.status(429).json({
                message: 'Too many requests please try again later'
            })
        }

        return res.status(500).json({
            message: 'Server error while reviewing code',
            error: error.message
        })
    }
}


const getAllReviews = async (req, res) => {
    try {

        if(!req.user){
            return res.status(401).json({
                message: 'Unauthorized User'
            })
        }

        const allReviews = await Review.find({
            userId: req.user._id
        }).sort({ createdAt: -1 })

        if(allReviews.length === 0) {
            return res.status(404).json({
                message: 'no reviews found for this user'
            })
        }

        return res.status(200).json({
            message: 'user reviews',
            data: allReviews
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Server error while fetching reviews',
        })
    }
}






export {
    reviewCode,
    getAllReviews
}
import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        code: {
            type: String,
            required: true
        },
        language: {
            type: String,
            required: true
        },
        review: {
            type: Object,  // stores full AI response
            required: true
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        }
    },
    { timestamps: true }
)

export const Review = mongoose.model('Review', reviewSchema)
const mongoose = require('mongoose');
const Purchase = require('./purchase');
const upload = require('../middleware/upload');

const recipeSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        images: [
            {
                type: String,
            },
        ],
        description: {
            type: String,
            required: true,
            trim: true,
        },
        ingredients: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                unit: {
                    type: String,
                    trim: true,
                },
            },
        ],
        steps: [
            {
                type: String,
            },
        ],
        price: {
            type: Number,
            required: true,
            trim: true,
            validator(value) {
                if (value < 0) {
                    throw new Error('Invalid price');
                }
            },
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        valuation: {
            type: Number,
            default: 0,
            trim: true,
            validator(value) {
                if (value < 0 || value > 5) {
                    throw new Error('Invalid valuation');
                }
            },
        },
        reviews: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'User',
                },
                text: {
                    type: String,
                    required: true,
                    trim: true,
                },
                valuation: {
                    type: Number,
                    required: true,
                    trim: true,
                    validator(value) {
                        if (value < 0 || value > 5) {
                            throw new Error('Invalid valuation');
                        }
                    },
                },
            },
        ],
    },
    { timestamps: true }
);

recipeSchema.post('validate', function (req, res, next) {
    req.body.images = req.files.map((file) => file.path);
    next();
});

recipeSchema.pre('remove', async function (next) {
    const recipe = this;
    await Purchase.deleteMany({ recipe: recipe._id });
    next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);
module.exports = Recipe;

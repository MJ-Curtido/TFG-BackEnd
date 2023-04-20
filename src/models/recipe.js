const mongoose = require('mongoose');
const Purchase = require('./purchase');

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
                description: {
                    type: String,
                    required: true,
                    trim: true,
                },
                image: {
                    type: Buffer,
                },
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
    },
    { timestamps: true }
);

recipeSchema.methods.toJSON = function () {
    const recipe = this;
    const objectRecipe = recipe.toObject();
    const author = objectRecipe.author;

    delete objectRecipe.author;
    objectRecipe.author = author.name;

    return objectRecipe;
};

recipeSchema.pre('remove', async function (next) {
    const recipe = this;
    await Purchase.deleteMany({ recipe: recipe._id });
    next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);
module.exports = Recipe;

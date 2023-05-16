const express = require('express');
const Purchase = require('../models/purchase');
const Recipe = require('../models/recipe');
const auth = require('../middleware/auth');
const router = new express.Router();

function sortByValuation(recipes) {
    return recipes.sort((a, b) => b.valuation - a.valuation);
}

//comprar receta
router.post('/purchases/buy', auth, async (req, res) => {
    const recipe = await Recipe.findOne({ _id: req.body.recipe, author: { $ne: req.user._id } });

    if (!recipe) {
        return res.status(404).send({ error: 'Recipe not found.' });
    }

    const purchase = new Purchase({
        recipe: req.body.recipe,
        user: req.user._id,
    });

    try {
        await purchase.save();

        res.status(201).send(purchase);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

//obtener recetas compradas
router.get('/purchases/me', auth, async (req, res) => {
    try {
        const purchases = await Purchase.find({ user: req.user._id });

        let recipeList = [];
        for (let i = 0; i < purchases.length; i++) {
            const recipe = await Recipe.findById({ _id: purchases[i].recipe }).populate('author');

            recipeList.push(recipe);
        }

        res.send(sortByValuation(recipeList));
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

module.exports = router;

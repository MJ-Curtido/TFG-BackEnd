const express = require('express');
const Purchase = require('../models/purchase');
const Recipe = require('../models/recipe');
const auth = require('../middleware/auth');
const router = new express.Router();
const pageSize = 10;

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
router.get('/purchases', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const skip = (page - 1) * pageSize;

        const totalRecipes = await Purchase.countDocuments({ user: req.user._id });

        if (totalRecipes === 0) {
            return res.status(404).send({ error: "You haven't bought any recipe." });
        }

        const purchases = await Purchase.find({ user: req.user._id });

        let recipeList = [];
        for (let i = 0; i < purchases.length; i++) {
            const recipe = await Recipe.findById({ _id: purchases[i].recipe }).populate('author');

            recipeList.push(recipe);
        }

        res.send({
            recipes: sortByValuation(recipeList).slice(skip, skip + pageSize),
            totalRecipes,
        });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener recetas compradas por titulo e ingrediente
router.get('/purchases/search/:search', auth, async (req, res) => {
    try {
        const { search } = req.params;
        let page;

        if (req.query.page) {
            page = parseInt(req.query.page);
        } else {
            return res.status('NaN').send({ error: `No more recipes found containing ${search}` });
        }

        const skip = (page - 1) * pageSize;

        const purchases = await Purchase.find({ user: req.user._id });

        let recipeList = [];
        for (let i = 0; i < purchases.length; i++) {
            const recipe = await Recipe.findById({ _id: purchases[i].recipe }).populate('author');

            recipeList.push(recipe);
        }
        let filteredRecipes = sortByValuation(recipeList.filter((recipe) => recipe.title.toLowerCase().includes(search.toLowerCase())));
        const remainingRecipes = recipeList.filter((recipe) => !filteredRecipes.includes(recipe));
        const filteredRecipesByIng = remainingRecipes.filter((recipe) => recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(search.toLowerCase())));
        filteredRecipes = filteredRecipes.concat(sortByValuation(filteredRecipesByIng));

        if (filteredRecipes.length === 0) {
            return res.status(404).send({ error: `No recipes found containing ${search}` });
        }

        const paginatedRecipes = filteredRecipes.slice(skip, skip + pageSize);

        if (paginatedRecipes.length === 0) {
            return res.status(404).send({ error: `No more recipes found containing ${search}` });
        }

        res.send({
            recipes: paginatedRecipes,
            totalRecipes: filteredRecipes.length,
        });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener si una receta esta comprada
router.get('/purchases/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findOne({ _id: req.params.id });

        if (!recipe) {
            return res.status(404).send({ error: 'Recipe not found.' });
        }

        const purchase = await Purchase.findOne({ recipe: req.params.id, user: req.user._id });

        if (!purchase) {
            return res.send({ bought: false });
        }

        res.send({ bought: true });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

module.exports = router;

const express = require('express');
const Recipe = require('../models/recipe');
const auth = require('../middleware/auth');
const router = new express.Router();

//crear receta
router.post('/recipes/create', auth, async (req, res) => {
    let recipe = new Recipe({
        ...req.body,
        author: req.user._id,
    });

    try {
        await recipe.save();
        recipe = await Recipe.findById(recipe._id).populate('author');
        res.status(201).send(recipe);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

//obtener mis recetas
router.get('/recipes/me', auth, async (req, res) => {
    try {
        const recipes = await Recipe.find({ author: req.user._id }).populate('author');

        if (recipes.length == 0) {
            return res.status(404).send({ error: "You haven't created any recipe." });
        }

        res.send(recipes);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener recetas disponibles
router.get('/recipes/avaliable', auth, async (req, res) => {
    try {
        const recipes = await Recipe.find({ author: { $ne: req.user._id } }).populate('author');

        res.send(recipes);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener recetas por ingrediente
router.get('/recipes/ingredients/:ingredient', auth, async (req, res) => {
    try {
        const { ingredient } = req.params;  
        const recipes = await Recipe.find({ author: { $ne: req.user._id } });

        const filteredRecipes = recipes.filter((recipe) => recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(ingredient.toLowerCase())));

        if (filteredRecipes.length === 0) {
            return res.status(404).send({ error: `No recipes found containing ingredient "${ingredient}"` });
        }

        res.send(filteredRecipes);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//modificar receta
router.patch('/recipes/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'images', 'description', 'ingredients', 'steps', 'price', 'author'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates.' });
    }

    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).send({ error: 'Recipe not found.' });
        }

        if (!recipe.author.equals(req.user._id)) {
            return res.status(401).send({ error: 'You are not authorized to update this recipe.' });
        }

        updates.forEach((update) => (recipe[update] = req.body[update]));
        await recipe.save();

        res.send(recipe);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

//eliminar receta
router.delete('/recipes/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);

        if (!recipe) {
            return res.status(404).send({ error: 'Recipe not found.' });
        }

        res.send(recipe);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

module.exports = router;

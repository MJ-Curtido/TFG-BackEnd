const express = require("express");
const Recipe = require("../models/recipe");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/recipe/create", auth, async (req, res) => {
    let recipe = new Recipe({
        ...req.body,
        author: req.user._id,
    });

    try {
        await recipe.save();
        recipe = await Recipe.findById(recipe._id).populate("author");
        res.status(201).send(recipe);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.get("/recipe/me", auth, async (req, res) => {
    try {
        const recipes = await Recipe.find({ author: req.user._id }).populate("author");

        if (recipes.length == 0) {
            return res.status(404).send({ error: "You haven't created any recipe." });
        }

        res.send(recipes);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.patch("/recipe/:id", async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["title", "image", "description", "ingredients", "steps", "price", "author"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid updates." });
    }

    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).send();
        }

        updates.forEach((update) => (recipe[update] = req.body[update]));
        await recipe.save();

        res.send(recipe);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete("/recipe/:id", async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);

        if (!recipe) {
            res.status(404).send();
        }

        res.send(recipe);
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;

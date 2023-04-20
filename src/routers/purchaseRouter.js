const express = require("express");
const Purchase = require("../models/purchase");
const Recipe = require("../models/recipe");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/purchases/buy", auth, async (req, res) => {
    const recipe = await Recipe.findOne({ _id: req.body.recipe });

    const purchase = new Purchase({
        recipe: recipe._id,
        user: req.user._id,
    });

    try {
        await purchase.save();

        res.status(201).send(purchase);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

router.get("/purchases/me", auth, async (req, res) => {
    try {
        const purchases = await Purchase.find({ user: req.user._id }).populate("recipe");

        let recipeList = [];
        for (let i = 0; i < purchases.length; i++) {
            const recipe = await Recipe.findOne({ _id: purchases[i].recipe }).populate("author");

            recipeList.push(recipe);
        }

        res.send(recipeList);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

router.get("/purchases/avaliable", auth, async (req, res) => {
    try {
        const purchases = await Purchase.find({ user: req.user._id });
        let idList = [];

        purchases.forEach((purchase) => {
            idList.push(purchase.recipe);
        });

        const recipes = await Recipe.find({ _id: { $nin: idList }, author: { $ne: req.user._id } });

        let recipesList = [];
        for (let i = 0; i < recipes.length; i++) {
            const recipe = await Recipe.findOne({ _id: recipes[i] }).populate("author");

            recipesList.push(recipe);
        }

        res.send(recipesList);
    } catch (e) {
        res.status(500).send({ error: e.message});
    }
});

module.exports = router;

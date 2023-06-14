const express = require('express');
const Recipe = require('../models/recipe');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const mime = require('mime-types');
const router = new express.Router();
const pageSize = 10;

function sortByValuation(recipes) {
    return recipes.sort((a, b) => b.valuation - a.valuation);
}

function sortByDate(recipes) {
    return recipes.sort((a, b) => b.createdAt - a.createdAt);
}

//petición especial para obtener las fotos de las recetas
router.get('/uploads/:imageName', async (req, res) => {
    const imageName = req.params.imageName;

    try {
        const imagePath = `./uploads/${imageName}`;

        if (fs.existsSync(imagePath)) {
            const file = fs.createReadStream(imagePath);
            const mimeType = mime.lookup(imagePath);
            res.setHeader('Content-Type', mimeType);
            file.pipe(res);
        } else {
            res.status(404).send();
        }
    } catch (e) {
        res.status(500).send();
    }
});

//crear receta
router.post('/recipes/create', upload.array('images'), auth, async (req, res) => {
    try {
        let recipe = new Recipe({
            ...req.body,
            author: req.user._id,
            images: req.files.map((file) => `${file.path.replace(/\\/g, '/')}`),
        });

        await recipe.save();

        recipe = await Recipe.findById(recipe._id).populate('author').populate('reviews.user');
        res.status(201).send(recipe);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

//obtener mis recetas
router.get('/recipes/me', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const skip = (page - 1) * pageSize;

        const totalRecipes = await Recipe.countDocuments({ author: req.user._id });

        if (totalRecipes === 0) {
            return res.status(404).send({ error: "You haven't created any recipe." });
        }

        const recipes = await Recipe.find({ author: req.user._id }).populate('author').populate('reviews.user');

        res.send({
            recipes: sortByValuation(recipes).slice(skip, skip + pageSize),
            totalRecipes,
        });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener recetas disponibles
router.get('/recipes/available', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const skip = (page - 1) * pageSize;

        const totalRecipes = await Recipe.countDocuments({ author: { $ne: req.user._id } });

        if (totalRecipes === 0) {
            return res.status(404).send({ error: 'There are no available recipes.' });
        }

        const recipes = await Recipe.find({ author: { $ne: req.user._id } })
            .populate('author')
            .populate('reviews.user');

        res.send({
            recipes: sortByValuation(recipes).slice(skip, skip + pageSize),
            totalRecipes,
        });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener recetas por titulo e ingrediente
router.get('/recipes/search/:search', auth, async (req, res) => {
    try {
        const { search } = req.params;
        let page;

        if (req.query.page) {
            page = parseInt(req.query.page);
        } else {
            return res.status('NaN').send({ error: `No more recipes found containing ${search}` });
        }

        const skip = (page - 1) * pageSize;

        const recipes = await Recipe.find({ author: { $ne: req.user._id } })
            .populate('author')
            .populate('reviews.user');
        let filteredRecipes = sortByValuation(recipes.filter((recipe) => recipe.title.toLowerCase().includes(search.toLowerCase())));
        const remainingRecipes = recipes.filter((recipe) => !filteredRecipes.includes(recipe));
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

//obtener recetas por id de usuario ordenadas por valoración
router.get('/recipes/user/valuation/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page);
        const skip = (page - 1) * pageSize;

        const totalRecipes = await Recipe.countDocuments({ author: id });

        if (totalRecipes === 0) {
            return res.send({
                recipes: [],
                totalRecipes,
            });
        }

        const recipes = await Recipe.find({ author: id }).populate('author').populate('reviews.user');

        res.send({
            recipes: sortByValuation(recipes).slice(skip, skip + pageSize),
            totalRecipes,
        });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener recetas por id de usuario ordenadas por fecha de creación
router.get('/recipes/user/date/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page);
        const skip = (page - 1) * pageSize;

        const totalRecipes = await Recipe.countDocuments({ author: id });

        if (totalRecipes === 0) {
            return res.send({
                recipes: [],
                totalRecipes,
            });
        }

        const recipes = await Recipe.find({ author: id }).populate('author').populate('reviews.user');

        res.send({
            recipes: sortByDate(recipes).slice(skip, skip + pageSize),
            totalRecipes,
        });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener receta por id
router.get('/recipes/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('author').populate('reviews.user');

        if (!recipe) {
            return res.status(404).send({ error: 'Recipe not found.' });
        }

        res.send(recipe);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener si una receta es mía
router.get('/recipes/me/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findOne({ _id: req.params.id, author: req.user._id });

        if (!recipe) {
            return res.send({ isMine: false });
        }

        return res.send({ isMine: true });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//subir review
router.patch('/recipes/:id/review', auth, async (req, res) => {
    const updates = Object.keys(req.body);

    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).send({ error: 'Recipe not found.' });
        }

        updates.forEach((update) => {
            if (update === 'reviews') {
                recipe.reviews.unshift(req.body.reviews);

                const totalValuation = recipe.reviews.reduce((acc, review) => acc + review.valuation, 0);
                recipe.valuation = totalValuation / recipe.reviews.length;
            }
        });
        await recipe.save();

        res.send(recipe);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

//modificar receta
router.patch('/recipes/:id', upload.array('images'), auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'images', 'description', 'ingredients', 'steps', 'price'];
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

        updates.forEach((update) => {
            if (update === 'images') {
                recipe[update] = req.files.map((file) => `${file.path.replace(/\\/g, '/')}`);
            } else {
                recipe[update] = req.body[update];
            }
        });
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

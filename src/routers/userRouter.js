const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth');

//registrar usuario
router.post('/users/signin', async (req, res) => {
    const user = new User(req.body);

    const existingUser = await User.findOne({ $or: [{ email: user.email }, { telephone: user.telephone }] });

    if (existingUser) return res.status(400).send({ error: 'Some data already exists.' });

    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//iniciar sesión
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);

        if (!user) return res.status(400).send({ error: 'Email or password is incorrect.' });

        const token = await user.generateAuthToken();

        res.send({ user, token });
    } catch (e) {
        res.status(400).send({ error: 'Email or password is incorrect.' });
    }
});

//cerrar sesión
router.get('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();

        res.send({ message: 'Log out successfully.' });
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//obtener usuario
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

//obtener usuario por id
router.get('/users/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).send({ error: 'User not found.' });

        res.send(user);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

//actualizar usuario
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'birthdate', 'telephone'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates' });
    }

    try {
        updates.forEach((update) => (req.user[update] = req.body[update]));
        await req.user.save();

        res.send(req.user);
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});

//eliminar usuario
router.delete('/users/me', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);

        res.send(req.user);
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});

module.exports = router;

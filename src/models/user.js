const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email");
            }
        },
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
    },
    telephone: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isMobilePhone(value)) {
                throw new Error("Invalid telephone");
            }
        },
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
});

userSchema.methods.toJSON = function () {
    const user = this;
    const objectUser = user.toObject();

    delete objectUser.password;
    delete objectUser.tokens;

    return objectUser;
};

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
};

userSchema.statics.findByCredentials = async function (email, password) {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Unable to sign in");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error("Unable to sign in");
    }

    return user;
};

userSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;

import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { createError } from '../utils/error.js';

export const register = async (req, res, next) => {
    try {
        const { name, email, phone, password: input_password } = req.body;

        if (!name || !email || !phone || !input_password) {
            console.log('Missing fields in request body:', req.body);
            return next(createError(400, 'Make sure to provide all the fields'));
        }
        if (!validator.isEmail(email)) {
            console.log('Invalid email pattern:', email);
            return res.status(204).json({ message: 'Invalid email pattern.', success: false });
        }

        const findedUser = await User.findOne({ email });
        if (Boolean(findedUser)) {
            console.log('User already exists:', email);
            return next(createError(400, 'User already exists'));
        }

        const hashedPassword = await bcrypt.hash(input_password, 12);
        const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';

        const result = await User.create({ name, email, phone, password: hashedPassword, role });
        console.log('User created successfully:', result);

        return res.status(200).json({ result, message: 'Register successfully', success: true });

    } catch (error) {
        console.error('Error during user registration:', error);
        next(createError(400, error.message));
    }
};

export const login = async (req, res, next) => {
    try {

        const { email, password: plain_password } = req.body;
        if (!email || !plain_password) return next(createError(400, 'Make sure to provide all the fields.'))

        const emailValidationFailed = !validator.isEmail(email)
        if (emailValidationFailed) return next(createError(400, 'Invalid Email Pattern'))

        var findedUser = await User.findOne({ email })
        if (!Boolean(findedUser)) return next(createError(400, 'User not exist'))

        const hashedPassword = findedUser.password
        const isPasswordCorrect = await bcrypt.compare(plain_password, hashedPassword)
        if (!isPasswordCorrect) return next(createError(400, 'Password Incorrect'))


        const token = jwt.sign({ _id: findedUser._id, role: findedUser.role }, process.env.JWT_SECRET)

        const { password, ...others } = findedUser._doc
        return res.status(200).json({ result: { ...others, token }, message: 'login successfully', success: true })
    }
    catch (error) {
        next(createError(400, error.message))
    }
}
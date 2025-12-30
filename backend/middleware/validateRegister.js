import {
    isValidEmail,
    isValidPassword,
    isValidBirthDate
} from "../utils/validation.js";

export const validateRegister = (req, res, next) => {
    const { email, password, date_birth } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }

    if (!isValidPassword(password)) {
        return res.status(400).json({
            message:
                "Password must be at least 8 characters long, contain one uppercase letter and one symbol."
        });
    }

    // DATUM JE VOLITELNÉ
    if (date_birth && !isValidBirthDate(date_birth)) {
        return res.status(400).json({ message: "Invalid birth date." });
    }

    next();
};

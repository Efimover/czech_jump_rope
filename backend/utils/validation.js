export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const isValidPassword = (password) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    return minLength && hasUppercase && hasSymbol;
};

export const isValidBirthDate = (date) => {
    if (!date) return false;

    const birth = new Date(date);
    const today = new Date();

    if (isNaN(birth.getTime())) return false;

    // nesmí být z budoucnosti
    if (birth > today) return false;

    // člověk nemůže mít 0 let (musí být aspoň 1 rok)
    const age = today.getFullYear() - birth.getFullYear();
    return age >= 1 && age <= 120; // rozumný limit
};

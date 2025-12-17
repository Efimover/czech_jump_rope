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

// ================================
// VALIDACE ROKU NAROZENÍ PRO SOUTĚŽE
// ================================
export const validateBirthYearForCompetition = (
    birthYear,
    competitionYear
) => {
    if (!birthYear || isNaN(birthYear)) {
        return "Rok narození musí být číslo";
    }

    if (birthYear < 1900) {
        return "Rok narození je příliš nízký";
    }

    if (birthYear > competitionYear) {
        return "Rok narození nemůže být v budoucnosti";
    }

    const age = competitionYear - birthYear;

    if (age < 3) {
        return "Závodník musí mít alespoň 3 roky";
    }

    if (age > 120) {
        return "Neplatný věk závodníka";
    }

    return null; // ✅ OK
};


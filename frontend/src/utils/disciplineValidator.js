export function validateDiscipline({
                                       form,
                                       customType,
                                       useCustomAge = false,
                                       customAge = null
                                   }) {
    const errors = [];

    if (!form.name?.trim()) {
        errors.push("Zadejte název disciplíny");
    }

    if (!form.type) {
        errors.push("Vyberte typ disciplíny");
    }

    if (form.type === "other" && !customType?.trim()) {
        errors.push("Zadejte vlastní typ disciplíny");
    }

    if (form.is_team) {
        if (!form.pocet_athletes || form.pocet_athletes < 2) {
            errors.push("Týmová disciplína musí mít alespoň 2 členy");
        }
    }

    // CREATE i EDIT – věkové kategorie
    if (!useCustomAge) {
        if (!Array.isArray(form.age_categories) || form.age_categories.length === 0) {
            errors.push("Vyberte alespoň jednu věkovou kategorii");
        }
    }

    // CREATE – vlastní věková kategorie
    if (useCustomAge) {
        if (!customAge?.name?.trim()) {
            errors.push("Zadejte název vlastní věkové kategorie");
        }

        if (
            customAge.min_age !== "" &&
            customAge.max_age !== "" &&
            Number(customAge.min_age) > Number(customAge.max_age)
        ) {
            errors.push("Minimální věk nemůže být větší než maximální");
        }
    }

    return errors;
}

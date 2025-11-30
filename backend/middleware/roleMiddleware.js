export const requireRole = (roleName) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!req.user.roles.includes(roleName)) {
            return res.status(403).json({
                error: `Forbidden: requires role '${roleName}'`
            });
        }

        next();
    };
};
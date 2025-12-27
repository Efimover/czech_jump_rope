export const requireRole = (...allowed) => {
    return (req, res, next) => {
        if (!allowed.includes(req.user.active_role)) {
            return res.status(403).json({
                error: "Nedostatečné oprávnění"
            });
        }
        next();
    };
};
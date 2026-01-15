export const errorHandler = (err, req, res, next) => {
    req.log.error({ err, stack: err.stack }, "Wystąpił nieobsłużony błąd serwera");

    if (res.headersSent) {
        return next(err);
    }
    
    res.status(500).json({
        message: "Wystąpił wewnętrzny błąd serwera",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
};

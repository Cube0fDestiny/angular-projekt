export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Wystąpił błąd serwera",
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
};
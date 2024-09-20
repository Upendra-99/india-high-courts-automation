const apiResponse = (res, statusCode, success, data = null) => {
    return res.status(statusCode).json({
        success,
        data,
    });
};

module.exports = apiResponse;

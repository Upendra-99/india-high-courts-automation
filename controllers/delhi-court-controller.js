const { fetchDelhiCaseData } = require('../services/delhi-court-service');
const apiResponse = require('../utils/api-response');

const getDelhiCases = async (req, res) => {
  try {
    const { sno, ctype, cno, cyear } = req.query;
    const caseData = await fetchDelhiCaseData(sno, ctype, cno, cyear);
    return apiResponse(res, 200, true, caseData);
  } catch (error) {
    console.log('error', error);
    return apiResponse(res, 500, false, error.message);
  }
};

module.exports = { 
  getDelhiCases,
};

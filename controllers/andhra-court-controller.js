const { fetchAndhraCaseData } = require('../services/andhra-court-service');
const apiResponse = require('../utils/api-response');

const getAndhraCases = async (req, res) => {
  try {
    const { searchtype, mtype, mno, myear } = req.query;
    const caseData = await fetchAndhraCaseData(searchtype, mtype, mno, myear);
    return apiResponse(res, 200, true, caseData);
  } catch (error) {
    console.log('error', error);
    return apiResponse(res, 500, false, error.message);
  }
};

module.exports = { 
  getAndhraCases
};

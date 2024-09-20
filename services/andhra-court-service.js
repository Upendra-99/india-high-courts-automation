const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { DELHI_COURT_URL, ANDHRA_COURT_URL } = require('../config/court-config');

const fetchAndhraCaseData = async (searchtype, mtype, mno, myear) => {
  try {
    const response = await axios.get(ANDHRA_COURT_URL, {
      params: { searchtype, mtype, mno, myear },
    });
    return parseAndhraCaseData(response.data);
  } catch (error) {
    throw new Error('Failed to fetch Andhra case data', error);
  }
};

const parseAndhraCaseData = (base64Content) => {
  const data = JSON.parse(atob(base64Content));

  const extractedData = [];
  try {
        extractedData.push({
          filingDate: data[0].filingdate,
          filingNo: data[0].srcasenum,
          caseStatus: data[0].pdrstatus,
          disposalDate: data[0].dispdate,
          disposalReason: data[0].disptype,
        });

  } catch (error) {
    console.log('got error while getting table', error);
  }

  return extractedData;
};

module.exports = { fetchAndhraCaseData };

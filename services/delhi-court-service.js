const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { DELHI_COURT_URL } = require('../config/court-config');

const fetchDelhiCaseData = async (sno, ctype, cno, cyear) => {
  try {
    const response = await axios.get(DELHI_COURT_URL, {
      params: { sno, ctype, cno, cyear },
    });

    return parseDelhiCaseData(response.data);
  } catch (error) {
    throw new Error('Failed to fetch Delhi case data', error);
  }
};

const parseDelhiCaseData = (htmlContent) => {

  fs.writeFileSync(path.join(__dirname, 'output.html'), htmlContent, 'utf8');

  const $ = cheerio.load(htmlContent);
  const extractedData = [];
  const table = $('.table.table-bordered.table-hover.table-striped');

  try {
      table.find('tr').each((index, row) => {
        
        if (index === 0) return; // Skip header row
    
        const columns = $(row).find('td');
        const caseInfoText = $(columns[1]).text().trim();
        const caseInfoParts = caseInfoText.split(/\n+/);
        const diaryAndCaseNo = caseInfoParts[0].trim(); 
        const caseStatusMatch = caseInfoText.match(/\[(.*?)\]/);
        const caseStatus = caseStatusMatch ? caseStatusMatch[1].trim() : '';
    
        // Extract the hyperlink for Order(s) Judgement(s)
        const judgementLink = $(columns[1]).find('a').attr('href') || '';
    
        const petitionerVsRespondentText = $(columns[2]).text().trim();
        const petitionerAndRespondent = petitionerVsRespondentText.split('Vs.');
    
        const petitioner = petitionerAndRespondent[0].trim();
        const respondentAndAdvocate = petitionerAndRespondent[1] ? petitionerAndRespondent[1].trim() : '';
    
        let advocateMatch = respondentAndAdvocate.match(/Advocate\s*:\s*(.*)/);
        const advocate = advocateMatch ? advocateMatch[1].trim() : '';
        const respondent = advocate ? respondentAndAdvocate.replace(advocateMatch[0], '').trim() : respondentAndAdvocate.trim();
    
        const listingText = $(columns[3]).html().trim();
        const listingParts = listingText.split(/<br\s*\/?>/);
    
        let courtNo = '';
        let nextDate = '';
        let date = '';
        let lastDate = '';
        let additionalInfo = '';
    
        listingParts.forEach(part => {
          const cleanPart = part.replace(/<[^>]+>/g, '').trim();
    
          if (cleanPart.startsWith('Next')) {
            const nextDateMatch = cleanPart.match(/Next\s+([\d\/]+)/);
            if (nextDateMatch) {
              nextDate = nextDateMatch[1].trim();
            }
          }
    
          const dateMatch = cleanPart.match(/Date\s*:\s*([\d\/]+)/);
          if (dateMatch) {
            date = dateMatch[1].trim();
          }
    
          const lastDateMatch = cleanPart.match(/Last\s*Date\s*:?(\s*[\d\/]+)/);
          if (lastDateMatch) {
            lastDate = lastDateMatch[1].trim();
          }
    
          const courtNoMatch = cleanPart.match(/Court\s*No\s*:?(\s*[\d\/]+)/);
          if (courtNoMatch) {
            courtNo = courtNoMatch[1].trim();
          }
    
          if (cleanPart.includes('TRANSFERRED') || cleanPart.includes('PENDING')) {
            additionalInfo = cleanPart;
          }
        });
        
        if (nextDate === date) {
            date = ''; // Reset date to avoid duplication
          } else if (date && !nextDate) {
              nextDate = date;
              date = ''; // Reset the date value
          }
          
          if (lastDate && additionalInfo) {
              lastDate += ` (${additionalInfo})`;
          }
          
          // Show nextDate only if caseStatus contains 'pending'
          if (!caseStatus.toLowerCase().includes('pending')) {
              nextDate = ''; // Reset nextDate if not pending
          }
    
        extractedData.push({
          diaryAndCaseNo,
          caseStatus,
          petitioner,
          respondent,
          advocate,
          courtNo: courtNo || 'N/A',
          nextDate,
          lastDate,
          additionalInfo,
          judgementLink
        });
      });
  } catch (error) {
    console.log('got error while getting table', error);
  }

  return extractedData;
};

module.exports = { fetchDelhiCaseData };

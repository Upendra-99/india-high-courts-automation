const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

// Custom wait function
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendCaptchaRequest = async (captchaUrl) => {
  console.log('Received captcha in sendCaptchaRequest:', captchaUrl);
  const requestData = {
    public_id: "1024",
    data: {
      captcha_type: "voter",
      document_url: captchaUrl,
    },
  };

  try {
    const response = await axios({
      method: 'post',
      url: 'http://localhost:8085/decaptcha',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=s%3Ax7hAfQdOhQJkSNP6ZhN6gOyNaOmOP8kR.XEX52MdYTma8VYsklBJCKFFbFcCfm19WWvBLBHbt4F0',
      },
      data: requestData,
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
};

// Function to handle captcha entry and submission
const handleCaptcha = async (page) => {
  let isCaptchaValid = false;

  while (!isCaptchaValid) {
    const captchaSrc = await page.$eval('#captcha', img => img.src);
    console.log('Captcha Source:', captchaSrc);

    const uniqueId = uuidv4();
    const imgPath = path.join(__dirname, 'img', `${uniqueId}.png`);

    // Fetch and save the captcha image
    const response = await axios.get(captchaSrc, { responseType: 'arraybuffer' });
    fs.writeFileSync(imgPath, response.data);
    console.log('Captcha saved as:', imgPath);

    const captchaBreak = await sendCaptchaRequest(captchaSrc);
    console.log('Captcha Break Response:', typeof captchaBreak, captchaBreak);

    if (captchaBreak && captchaBreak.result && captchaBreak.result.captcha_text) {
      const captchaText = captchaBreak.result.captcha_text;

      await page.waitForSelector('#vercode');

      await page.click('#vercode', { clickCount: 3 });
      await page.keyboard.press('Backspace');

      await page.type('#vercode', captchaText);
      console.log('Entered Captcha Text:', captchaText);

      await page.waitForSelector('input[name="submit"]');
      await page.click('input[name="submit"]');

      await waitFor(3000);

      // Check if the captcha is valid by looking for the error message
      const captchaError = await page.$('#captcha_error');
      if (captchaError) {
        const errorText = await page.evaluate(el => el.textContent, captchaError);
        if (errorText.includes('Invalid Captcha')) {
          console.log('Invalid Captcha, refreshing...');

          await page.click('#reload-button');

          await page.waitForSelector('#captcha');
        } else {
          // If there are no errors, exit the loop
          isCaptchaValid = true;
        }
      } else {
        // If no error is found, exit the loop
        isCaptchaValid = true;
      }
    } else {
      console.error('No captcha text received. Cannot fill in the captcha input.');
      break;
    }
  }
};

(async () => {
  // Create the img directory if it doesn't exist
  const imgDir = path.join(__dirname, 'img');
  if (!fs.existsSync(imgDir)){
    fs.mkdirSync(imgDir);
  }

  // Launch the browser
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://karnatakajudiciary.kar.nic.in/newwebsite/casemenu.php');

  await page.waitForSelector('select#benchid');

  await page.select('select#benchid', 'B');

  await waitFor(4000);

  const selectedBench = await page.evaluate(() => {
    const benchDropdown = document.querySelector('select#benchid');
    return benchDropdown.options[benchDropdown.selectedIndex].text;
  });
  console.log('Selected Bench:', selectedBench);

  await page.waitForSelector('select#case_types');

  await page.select('select#case_types', 'WP');

  await waitFor(1000);

  await page.waitForSelector('#case_no');
  await page.type('#case_no', '123');

  await page.waitForSelector('#case_year');
  await page.type('#case_year', '2020');

  await waitFor(3000);

  await page.waitForSelector('#captcha');

  await handleCaptcha(page);

  await browser.close();
})();

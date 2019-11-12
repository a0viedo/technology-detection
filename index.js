const url = require('url');
const https = require('https');
const util = require('util');
const isUrl = require('is-url');
const get = util.promisify(https.get);

function clearLine() {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
}

module.exports = async function (domain) {
  let domainResult;
  if(!domain || (isUrl(domain) && isUrl(`https://${domain}`))) {
    console.log('Invalid URL');
    return process.exit(1);
  }

  const firstAttempt = url.parse(domain);
  if(!firstAttempt.host) {
    const secondAttempt = url.parse(`https://${domain}`);
    if(!secondAttempt.host) {
      console.log(`Couldn't parse the url`);
      return process.exit(1);
    } else {
      domainResult = secondAttempt;
    }
  } else {
    domainResult = firstAttempt;
  }

  let result = '';
  const Spinner = require('cli-spinner').Spinner;
 
  const spinner = new Spinner('loading %s');
  spinner.setSpinnerString(18);
  spinner.start();
  https.get(`https://technology-detection.webcodex.dev/${domainResult.host}`, (res) => {
    res.setEncoding('utf8');
    res.on('data', data => {
      result += data;
    });

    res.on('end', () => {
      spinner.stop();
      if(res.statusCode !== 200 || !result) {
        clearLine();
        console.log(`There was an error trying to get the technology list`);
        return process.exit(1);
      }
      const parsedResult = JSON.parse(result);
      clearLine();
      if(parsedResult.length === 0) {
        console.log('No technologies were detected, sorry :/');
        return process.exit(0);
      }
      console.log(`The website is using ${parsedResult.map((x, i) => {
        if(i === parsedResult.length -1) {
          if(parsedResult.length === 1) {
            return x;
          }
          return `and ${x}`;
        }

        if(i === parsedResult.length -2) {
          return `${x} `;
        }
        return `${x}, `;
      }).join('')}`);
    });
  }).on('error', err => {
    clearLine();
    console.log(`There was an error retrieving the technology list: ${err.message}`);
  });
};

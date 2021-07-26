const fs = require('fs');
const YAML = require('yaml');
const oauth = require('sn-oauth').default;
const axios = require('axios').default;
const configObj = YAML.parse(fs.readFileSync('./sn.deploy.config.yml', 'utf-8'));

const instanceUrl = "https://" + configObj.instanceName + ".service-now.com";
const tableApiUrl = `${instanceUrl}/api/now/table`;

async function getUiPageRecord(name, authHeader) {
  try {
    let getUrl = `${tableApiUrl}/sys_ui_page?sysparm_query=name=${name}`;
    let response = await axios.get(getUrl, { headers: authHeader });
    return {
      "result": response.data.result[0],
      "status": response.status
    };
  } catch (err) {
    if (err.response.status) return { "status": 401 };
  }
}

(async function () {
  var accessToken;
  const refreshTokenPath = './.sn-token';
  if (!fs.existsSync(refreshTokenPath)) {
    let tokenObj = await oauth(configObj.instanceName, configObj.clientId);
    accessToken = tokenObj.accessToken;
    fs.writeFileSync(refreshTokenPath, JSON.stringify(tokenObj));
  } else {
    let tokenObj = JSON.parse(fs.readFileSync(refreshTokenPath, 'utf-8'));
    accessToken = tokenObj.accessToken;
  }
  var authHeader = { 'Authorization': `Bearer ${accessToken}` }
  var uiPageResult = await getUiPageRecord("sn-rrule-generator", authHeader);
  if (uiPageResult.status == 401) {
    let tokenObj = JSON.parse(fs.readFileSync(refreshTokenPath, 'utf-8'));
    tokenObj = await oauth(configObj.instanceName, configObj.clientId, tokenObj.clientSecret, tokenObj.refreshToken);
    accessToken = tokenObj.accessToken;
    fs.writeFileSync(refreshTokenPath, JSON.stringify(tokenObj));
  }
  console.log(uiPageResult);
})();
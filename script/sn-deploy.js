const fs = require('fs');
const YAML = require('yaml');
const oauth = require('sn-oauth').default;
const axios = require('axios').default;
const configObj = YAML.parse(fs.readFileSync('./sn.config.yml', 'utf-8'));

const tokenPath = './.sn-token';
var accessToken, instanceUrl, tableApiUrl;
if (fs.existsSync(tokenPath)) {
  let tokenObj = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  instanceUrl = "https://" + tokenObj.instanceName + ".service-now.com";
  tableApiUrl = `${instanceUrl}/api/now/table`;
  accessToken = tokenObj.accessToken;
}

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
  if (!fs.existsSync(tokenPath)) {
    let tokenObj = await oauth();
    instanceUrl = "https://" + tokenObj.instanceName + ".service-now.com";
    tableApiUrl = `${instanceUrl}/api/now/table`;
    accessToken = tokenObj.accessToken;
    fs.writeFileSync(tokenPath, JSON.stringify(tokenObj));
  }
  var authHeader = { 'Authorization': `Bearer ${accessToken}` }
  var uiPageResult = await getUiPageRecord(configObj.uiPageName, authHeader);
  if (uiPageResult.status == 401) {
    let tokenObj = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    tokenObj = await oauth(tokenObj.instanceName, tokenObj.clientId, tokenObj.clientSecret, tokenObj.refreshToken);
    accessToken = tokenObj.accessToken;
    fs.writeFileSync(tokenPath, JSON.stringify(tokenObj));
  }
  console.log(uiPageResult);
})();
const axios = require('axios');
const cron = require('node-cron');
const { axiosAPI } = require('../utils/axiosAPI');
const cognitoService = require('../services/awsUserService');

function formatEmailContent(content, placeholders) {
  return content.replace(/\{{(.*?)\}}/g, (match, key) => placeholders[key.trim()] || "");
}

function getFormattedEmail(content,placeholders) {
  return {
    // Subject stays the same
    subject: content.subject, 
    // Placeholders like {{username}} and {{name}} are replaced with real values
    emailBody: formatEmailContent(content?.emailBody, placeholders), 
  };
}

const listUsers = async () => {
  try {
    return await cognitoService.listUsers();
  } catch (err) {
    console.error('Error listing users:', err);
    throw err;
  }
};

const getAdminEmails = async () => {
  const users = await listUsers();
  // Find all admin users
  const adminUsers = users.filter(user => 
    user.Attributes.some(attr => attr.Name === 'custom:isAdmin' && attr.Value === 'true')
  );

  if (adminUsers.length > 0) {
    // Extract emails of all admin users
    const adminEmails = adminUsers.map(user => 
      user.Attributes.find(attr => attr.Name === 'email').Value
    );
    return adminEmails;
  } else {
    console.log('No Admin Users Found');
    return [];
  }
};

async function generateCartoMasterKey () {
  const optionsMaster = {
    data: {
      audience: process.env.CARTO_AUDIENCE || 'carto-cloud-native-api',
      client_id: process.env.CARTO_CLIENT_ID,
      client_secret: process.env.CARTO_CLIENT_SECRET,
      grant_type: process.env.CARTO_GRANT_TYPE || 'client_credentials'
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    url: process.env.CARTO_AUTH_API || 'https://auth.carto.com/oauth/token'
  };

  try {
    const { data: { access_token: accessToken }} = await axios(optionsMaster);
    return accessToken;
  } catch (err) {
      console.log(err);
  }
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function setCartoToken () {
  const token = await generateCartoMasterKey();
  axiosAPI.defaults.headers.common.Authorization = `Bearer ${token}`
}

function setCartoTokenCron() {
  cron.schedule('00 00 * * *', () => {
    setCartoToken();
  });
}

module.exports = {
    generateCartoMasterKey,
    getAdminEmails,
    getFormattedEmail,
    getRandomInt,
    setCartoToken,
    setCartoTokenCron,
};
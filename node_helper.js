/* eslint-disable */
const NodeHelper = require('node_helper');
const request = require('request');
const env = require('./env');

const agent = request.defaults({ json: true });

const randomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const createApiUrl = () => {
  const timestamp = Math.round(Date.now() / 1000);
  const nonce = randomString(32);
  return `http://api.health.nokia.com/measure?action=getmeas&oauth_consumer_key=${env.apiKey}&oauth_nonce=${nonce}&oauth_signature=${env.oauthSignature}&oauth_signature_method=HMAC-SHA1&oauth_timestamp=${timestamp}&oauth_token=${env.accessToken}&oauth_version=1.0&userid=${env.userId}`;
}

module.exports = NodeHelper.create({
  start: function() {
    agent.get(createApiUrl(), undefined, (error, response, body) => {
      console.log(body);
    });
  },
});
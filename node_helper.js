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

const generateQuery = (params) => 
  Object.keys(params)
    .map((key) => key + '=' + params[key])
    .join('&');

const measureTypes = {
  weight: 1,
};

const createApiUrl = () => {
  const timestamp = Math.round(Date.now() / 1000);
  const nonce = randomString(32);
  const queryParams = generateQuery({
    action: 'getmeas',
    oauth_consumer_key: env.apiKey,
    oauth_nonce: nonce,
    oauth_signature: env.oauthSignature,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: env.accessToken,
    oauth_version: '1.0',
    userid: env.userId,
    meastype: measureTypes.weight,
    limit: 7,
  });
  return `http://api.health.nokia.com/measure?${queryParams}`;
}

const isWeightType = measure => measure.type === measureTypes.weight;

module.exports = NodeHelper.create({
  socketNotificationReceived: function(notification) {
    if (notification === 'MMM_WITHINGS_START') {
      this.checkLatestWeight();
      setInterval(() => {
        this.checkLatestWeight();
      }, 30000);
    }
  },
  
  checkLatestWeight: function() {
    agent.get(createApiUrl(), undefined, (error, response, body) => {
      if (error) {
        return;
      }
      const weights = body.body.measuregrps.map(measuregrp => {
        const measure = measuregrp.measures.find(isWeightType);
        return measure.value * Math.pow(10, measure.unit);
      });

      this.sendSocketNotification(
        'NEW_WEIGHT', 
        { 
          date: body.body.measuregrps[0].date,
          weights,
        }
      );
    });
  }
});
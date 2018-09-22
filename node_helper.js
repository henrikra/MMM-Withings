// @ts-check

/* eslint-disable */
const NodeHelper = require('node_helper');
const request = require('request');

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

/**
 * 
 * @param {object} config 
 */
const createApiUrl = (config) => {
  const timestamp = Math.round(Date.now() / 1000);
  const nonce = randomString(32);
  const queryParams = generateQuery({
    action: 'getmeas',
    oauth_consumer_key: config.apiKey,
    oauth_nonce: nonce,
    oauth_signature: config.oauthSignature,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: config.accessToken,
    oauth_version: '1.0',
    userid: config.userId,
    meastype: measureTypes.weight,
    limit: 7,
  });
  return `http://api.health.nokia.com/measure?${queryParams}`;
}

const isWeightType = measure => measure.type === measureTypes.weight;

module.exports = NodeHelper.create({
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'MMM_WITHINGS_START') {
      this.checkLatestWeight(payload);
      setInterval(() => {
        this.checkLatestWeight(payload);
      }, 30000);
    }
  },
  
  checkLatestWeight: function(config) {
    agent.get(createApiUrl(config), undefined, (error, response, body) => {
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
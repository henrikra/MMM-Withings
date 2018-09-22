// @ts-check

/* eslint-disable */
const NodeHelper = require('node_helper');
const request = require('request');

const agent = request.defaults({ json: true });

const generateQuery = (params) => 
  Object.keys(params)
    .map((key) => key + '=' + params[key])
    .join('&');

const measureTypes = {
  weight: 1,
};

/**
 * @typedef {Object} Config
 * @property {string} accessToken
 */

/**
 * 
 * @param {Config} config 
 */
const createApiUrl = (config) => {
  const queryParams = generateQuery({
    action: 'getmeas',
    access_token: config.accessToken,
    meastype: measureTypes.weight,
  });
  return `https://wbsapi.withings.net/measure?${queryParams}`;
}

const isWeightType = measure => measure.type === measureTypes.weight;

module.exports = NodeHelper.create({
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'MMM_WITHINGS_START') {
      if (payload.accessToken) {
        const apiUrl = createApiUrl(payload);
        this.checkLatestWeight(apiUrl);
        setInterval(() => {
          this.checkLatestWeight(apiUrl);
        }, 30000);
      } else {
        console.error('Configuration object was invalid. Check README for documentation', payload);
        this.sendSocketNotification('ERROR', 'Check your configuration')
      }
    }
  },
  
  /**
   * 
   * @param {string} apiUrl 
   */
  checkLatestWeight: function(apiUrl) {
    agent.get(apiUrl, undefined, (error, response, body) => {
      if (error) {
        console.error('Something went wrong with Withings call', error);
        this.sendSocketNotification('ERROR', 'Something went wrong. Are you connected to Internet?');
      } else if (body.status === 0) {
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
      } else {
        console.error('Withings API responded with error', body);
        this.sendSocketNotification('ERROR', body.error);
      }
    });
  }
});
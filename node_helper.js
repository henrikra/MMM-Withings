// @ts-check

const NodeHelper = require('node_helper');
const request = require('request');

const agent = request.defaults({ json: true });

const generateQuery = params =>
  Object.keys(params)
    .map(key => key + '=' + params[key])
    .join('&');

const measureTypes = {
  weight: 1,
};

/**
 * @typedef {Object} Config
 * @property {string} clientId
 * @property {string} consumerSecret
 * @property {string} authorizationCode
 * @property {string} redirectUri
 */

const isWeightType = measure => measure.type === measureTypes.weight;

module.exports = NodeHelper.create({
  start() {
    this.currentConfig = undefined;
    this.currentAuthentication = undefined;
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'MMM_WITHINGS_INIT') {
      this.currentConfig = payload.config;
      this.currentAuthentication = payload.storedAuthentication;

      if (this.currentAuthentication) {
        this.startPolling();
      } else {
        agent.post(
          'https://account.withings.com/oauth2/token',
          {
            form: {
              grant_type: 'authorization_code',
              client_id: this.currentConfig.clientId,
              client_secret: this.currentConfig.consumerSecret,
              code: this.currentConfig.authorizationCode,
              redirect_uri: this.currentConfig.redirectUri,
            },
          },
          (error, response, body) => {
            if (error) {
              console.error('authorization_code failed', error);
              this.sendSocketNotification('ERROR', 'Authorization failed, check the logs');
              return;
            }
            if (response.statusCode === 200) {
              this.currentAuthentication = body;
              this.sendSocketNotification('ACCESS_TOKEN_SUCCESS', body);
              this.startPolling();
            } else {
              console.error(`authorization_code failed with ${response.statusCode}`, body);
              this.sendSocketNotification('ERROR', body.errors[0].message);
            }
          },
        );
      }
    }
  },

  startPolling() {
    this.fetchWeight();
    setInterval(() => {
      this.fetchWeight();
    }, this.currentConfig.fetchInterval);
  },

  createMeasureEndpoint() {
    const queryParams = generateQuery({
      action: 'getmeas',
      access_token: this.currentAuthentication.access_token,
      meastype: measureTypes.weight,
    });
    return `https://wbsapi.withings.net/measure?${queryParams}`;
  },

  fetchWeight() {
    agent.get(this.createMeasureEndpoint(), undefined, (error, response, body) => {
      if (error) {
        console.error('Something went wrong with Withings call', error);
        this.sendSocketNotification(
          'ERROR',
          'Something went wrong. Are you connected to Internet?',
        );
      } else if (body.status === 0) {
        const weights = body.body.measuregrps.map(measuregrp => {
          const measure = measuregrp.measures.find(isWeightType);
          return measure.value * Math.pow(10, measure.unit);
        });

        this.sendSocketNotification('NEW_WEIGHT', {
          date: body.body.measuregrps[0].date,
          weights,
        });
      } else if (body.status === 401) {
        agent.post(
          'https://account.withings.com/oauth2/token',
          {
            form: {
              grant_type: 'refresh_token',
              client_id: this.currentConfig.clientId,
              client_secret: this.currentConfig.consumerSecret,
              refresh_token: this.currentAuthentication.refresh_token,
            },
          },
          (error, response, body) => {
            if (error) {
              console.error('refresh_token failed', error);
              this.sendSocketNotification('ERROR', 'Refresh token failed, check the logs');
              return;
            }
            if (response.statusCode === 200) {
              this.currentAuthentication = body;
              this.sendSocketNotification('ACCESS_TOKEN_SUCCESS', body);
            } else {
              console.error(`refresh_token failed with ${response.statusCode}`, body);
              this.sendSocketNotification('ERROR', body.error);
            }
          },
        );
      } else {
        console.error('Withings API responded with error', body);
        this.sendSocketNotification('ERROR', body.error);
      }
    });
  },
});

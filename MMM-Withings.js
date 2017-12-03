/* eslint-disable */
Module.register('MMM-Withings', {
  start: function() {
    this.state = {};
    this.sendSocketNotification('MMM_WITHINGS_START');
  },

  getScripts: function() {
    return ['moment.js'];
  },

  getTranslations: function() {
    return {
      en: 'translations/en.json',
      fi: 'translations/fi.json',
    }
  },

  setState: function(newData, animationSpeed) {
    this.state = Object.assign({}, this.state, newData);
    this.updateDom(animationSpeed);
  },

  socketNotificationReceived: function(notification, payload) {
    this.setState({ weight: payload.weight, date: payload.date }, 1000);
  },

  formatWeight: function() {
    return `${this.state.weight.toFixed(1)} kg`;
  },

  getDom: function() {
    const wrapper = document.createElement('div');
    const upperText = document.createElement('div');
    const lowerText = document.createElement('div');
    upperText.classList.add('small');
    upperText.innerHTML = this.state.weight ? this.translate('agoYouWere', {agoTime: moment(this.state.date * 1000).fromNow()}) : '';
    lowerText.classList.add('medium');
    lowerText.innerHTML = this.state.weight ? this.formatWeight() : this.translate('loading');
    wrapper.appendChild(upperText);
    wrapper.appendChild(lowerText);
    return wrapper;
  }
});
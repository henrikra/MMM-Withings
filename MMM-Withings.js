/* eslint-disable */
Module.register('MMM-Withings', {
  start: function() {
    this.state = {};
    this.sendSocketNotification('MMM_WITHINGS_START');
  },

  setState: function(newData, animationSpeed) {
    this.state = Object.assign({}, this.state, newData);
    this.updateDom(animationSpeed);
  },

  socketNotificationReceived: function(notification, payload) {
    this.setState({ weight: payload.weight });
  },

  formatWeight: function() {
    return `Current weight: ${this.state.weight.toFixed(1)} kg`;
  },

  getDom: function() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.state.weight ? this.formatWeight() : 'lol';
    return wrapper;
  }
});
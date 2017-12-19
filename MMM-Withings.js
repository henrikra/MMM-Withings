/* eslint-disable */
const capitalizeFirst = (string) => string.charAt(0).toUpperCase() + string.slice(1);

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
    this.setState({
      weight: payload.weight,
      date: payload.date,
      weightDifference: payload.weightDifference,
    }, 1000);
  },

  formatWeight: function() {
    return `${this.state.weight.toFixed(1)} kg (${
      this.state.weightDifference > 0
        ? `+${this.state.weightDifference.toFixed(1)}`
        : this.state.weightDifference.toFixed(1)
    })`;
  },

  drawGraph: function(canvas, hasWeight) {
    if (hasWeight) {
      const ctx = canvas.getContext('2d');
      const graphValues = [77.1, 79.4, 81.0, 77.8, 78.1];
      ctx.fillStyle = '#ffffff';
      graphValues.forEach((graphValue, index) => {
        ctx.beginPath();
        ctx.arc(index * 30, graphValue, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  },

  getDom: function() {
    const wrapper = document.createElement('div');
    const upperText = document.createElement('div');
    const lowerText = document.createElement('div');
    const canvas = document.createElement('canvas');
    
    upperText.classList.add('small');
    upperText.innerHTML = this.state.weight 
    ? this.translate('agoYouWere', {agoTime: capitalizeFirst(moment(this.state.date * 1000).fromNow())}) 
    : '';
    lowerText.classList.add('medium');
    lowerText.innerHTML = this.state.weight ? this.formatWeight() : this.translate('loading');
    canvas.setAttribute('id', 'graph');
    canvas.setAttribute('width', '300');
    canvas.setAttribute('height', '200');
    canvas.setAttribute('style', 'border: 1px solid #ffffff')
    
    wrapper.appendChild(upperText);
    wrapper.appendChild(lowerText);
    wrapper.appendChild(canvas);
    
    this.drawGraph(canvas, !!this.state.weight);
    
    return wrapper;
  }
});
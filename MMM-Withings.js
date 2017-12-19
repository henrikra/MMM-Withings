/* eslint-disable */
const capitalizeFirst = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const canvasWidth = 300;

Module.register('MMM-Withings', {
  start: function() {
    this.state = {};
    this.canvasHeight = 100;
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
      const graphValues = [77.1, 79.4, 81.0, 77.8, 78.1, 77.7, 77.9];
      const minValue = Math.min(...graphValues);
      const maxValue = Math.max(...graphValues);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      graphValues.forEach((graphValue, index, allGraphValues) => {
        const circleRadius = 2;
        const offSetYFromEdges = circleRadius * 3;
        const offSetXFromEdges = offSetYFromEdges / 2;
        
        const x = index * 30 + offSetXFromEdges;
        const y = this.canvasHeight - (this.canvasHeight - offSetYFromEdges) * (graphValue - minValue) / (maxValue - minValue) - offSetXFromEdges
        ctx.beginPath();
        ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, y);
        const secondX = (index + 1) * 30 + offSetXFromEdges;
        const secondY = this.canvasHeight - (this.canvasHeight - offSetYFromEdges) * (allGraphValues[index + 1] - minValue) / (maxValue - minValue) - offSetXFromEdges
        ctx.lineTo(secondX, secondY);
        ctx.stroke();
      });
      ctx.font = '24px "Roboto Condensed"';
      ctx.fillText('+ 0.5', graphValues.length * 30, this.canvasHeight / 2);
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
    canvas.setAttribute('width', canvasWidth);
    canvas.setAttribute('height', this.canvasHeight);
    
    wrapper.appendChild(upperText);
    wrapper.appendChild(lowerText);
    wrapper.appendChild(canvas);
    
    this.drawGraph(canvas, !!this.state.weight);
    
    return wrapper;
  }
});
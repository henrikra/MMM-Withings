/* eslint-disable */
const capitalizeFirst = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const canvasWidth = 300;
const canvasHeight = 100;

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
      date: payload.date,
      weights: payload.weights,
    }, 1000);
  },

  formatWeight: function() {
    const [latestWeight] = this.state.weights;
    return `${latestWeight.toFixed(1)} kg`;
  },

  drawGraph: function(canvas) {
    if (this.state.weights) {
      const ctx = canvas.getContext('2d');
      const graphValues = [...this.state.weights].reverse();
      const minValue = Math.min(...graphValues);
      const maxValue = Math.max(...graphValues);
      ctx.fillStyle = '#aaaaaa';
      ctx.strokeStyle = '#aaaaaa';
      const spaceBetweenX = 30;
      graphValues.forEach((graphValue, index, allGraphValues) => {
        const circleRadius = 2;
        const offSetYFromEdges = circleRadius * 3;
        const offSetXFromEdges = offSetYFromEdges / 2;
        
        const x = index * spaceBetweenX + offSetXFromEdges;
        const y = canvasHeight - (canvasHeight - offSetYFromEdges) * (graphValue - minValue) / (maxValue - minValue) - offSetXFromEdges
        ctx.beginPath();
        ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, y);
        const secondX = (index + 1) * spaceBetweenX + offSetXFromEdges;
        const secondY = canvasHeight - (canvasHeight - offSetYFromEdges) * (allGraphValues[index + 1] - minValue) / (maxValue - minValue) - offSetXFromEdges
        ctx.lineTo(secondX, secondY);
        ctx.stroke();
      });
      ctx.font = '300 24px "Roboto Condensed"';
      const [latestWeight, secondLatestWeight] = this.state.weights;
      const weightDifference = latestWeight - secondLatestWeight;
      ctx.fillText(
        `${weightDifference > 0 ? '+' : '-'} ${Math.abs(weightDifference).toFixed(1)}`, 
        graphValues.length * spaceBetweenX, 
        canvasHeight / 2
      );
    }
  },

  getDom: function() {
    const wrapper = document.createElement('div');
    const upperText = document.createElement('div');
    const lowerText = document.createElement('div');
    const canvas = document.createElement('canvas');
    
    upperText.classList.add('small');
    upperText.innerHTML = this.state.date 
    ? this.translate('agoYouWere', {agoTime: capitalizeFirst(moment(this.state.date * 1000).fromNow())}) 
    : '';
    lowerText.classList.add('medium');
    lowerText.innerHTML = this.state.weights ? this.formatWeight() : this.translate('loading');
    canvas.setAttribute('id', 'graph');
    canvas.setAttribute('width', canvasWidth);
    canvas.setAttribute('height', canvasHeight);
    
    wrapper.appendChild(upperText);
    wrapper.appendChild(lowerText);
    wrapper.appendChild(canvas);
    
    this.drawGraph(canvas);
    
    return wrapper;
  }
});
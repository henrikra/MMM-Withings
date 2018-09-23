const capitalizeFirst = string => string.charAt(0).toUpperCase() + string.slice(1);

const canvasWidth = 300;
const canvasHeight = 100;

Module.register('MMM-Withings', {
  defaults: {
    fetchInterval: 30000,
  },
  
  start() {
    if (
      !this.config.clientId ||
      !this.config.consumerSecret ||
      !this.config.authorizationCode ||
      !this.config.redirectUri
    ) {
      this.setState({ error: 'Config object invalid. Check the documentation' });
    } else {
      this.state = {};

      const storedAuthentication = JSON.parse(localStorage.getItem('MMM_WITHINGS_AUTHENTICATION'));

      this.sendSocketNotification('MMM_WITHINGS_INIT', {
        config: this.config,
        storedAuthentication,
      });
    }
  },

  getScripts() {
    return ['moment.js'];
  },

  getTranslations() {
    return {
      en: 'translations/en.json',
      fi: 'translations/fi.json',
    };
  },

  setState(newData, animationSpeed) {
    this.state = Object.assign({}, this.state, newData);
    this.updateDom(animationSpeed);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === 'NEW_WEIGHT') {
      this.setState(
        {
          date: payload.date,
          weights: payload.weights,
          error: undefined,
        },
        1000,
      );
    } else if (notification === 'ERROR') {
      this.setState({ error: payload }, 1000);
    } else if (notification === 'ACCESS_TOKEN_SUCCESS') {
      localStorage.setItem('MMM_WITHINGS_AUTHENTICATION', JSON.stringify(payload));
    }
  },

  formatWeight() {
    const [latestWeight] = this.state.weights;
    return `${latestWeight.toFixed(1)} kg`;
  },

  drawGraph(canvas) {
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
        const y =
          canvasHeight -
          ((canvasHeight - offSetYFromEdges) * (graphValue - minValue)) / (maxValue - minValue) -
          offSetXFromEdges;
        ctx.beginPath();
        ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, y);
        const secondX = (index + 1) * spaceBetweenX + offSetXFromEdges;
        const secondY =
          canvasHeight -
          ((canvasHeight - offSetYFromEdges) * (allGraphValues[index + 1] - minValue)) /
            (maxValue - minValue) -
          offSetXFromEdges;
        ctx.lineTo(secondX, secondY);
        ctx.stroke();
      });
      ctx.font = '300 24px "Roboto Condensed"';
      const [latestWeight, secondLatestWeight] = this.state.weights;
      const weightDifference = latestWeight - secondLatestWeight;
      ctx.fillText(
        `${weightDifference > 0 ? '+' : '-'} ${Math.abs(weightDifference).toFixed(1)}`,
        graphValues.length * spaceBetweenX,
        canvasHeight / 2,
      );
    }
  },

  getDom() {
    const wrapper = document.createElement('div');
    const upperText = document.createElement('div');
    const lowerText = document.createElement('div');
    const canvas = document.createElement('canvas');

    upperText.classList.add('small');
    lowerText.classList.add('medium');
    canvas.setAttribute('id', 'graph');
    canvas.setAttribute('width', canvasWidth);
    canvas.setAttribute('height', canvasHeight);

    if (this.state.error) {
      upperText.innerHTML = `Error in ${this.name}`;
      lowerText.innerHTML = this.state.error;
    } else {
      upperText.innerHTML = this.state.date
        ? this.translate('agoYouWere', {
            agoTime: capitalizeFirst(moment(this.state.date * 1000).fromNow()),
          })
        : '';
      lowerText.innerHTML = this.state.weights ? this.formatWeight() : this.translate('loading');
    }

    wrapper.appendChild(upperText);
    wrapper.appendChild(lowerText);
    wrapper.appendChild(canvas);

    this.drawGraph(canvas);

    return wrapper;
  },
});

'use strict';

const UI = (function() {
  navigator.mozL10n.ready(function localize() {
    // Do nothing rigth now
  });

  var settingsView = document.querySelector('#settings-view');

  var settingsOpen = document.querySelector('#settings-open');
  settingsOpen.addEventListener('click', function(e) {
    settingsView.dataset.pagePosition = 'viewport';
  });

  var settingsDone = document.querySelector('#settings-done');
  settingsDone.addEventListener('click', function(e) {
    settingsView.dataset.pagePosition = 'bottom';
  });

  var alarmSound = new Howl({
    urls: ['res/alarm.wav']
  });
  
  var coinSound = new Howl({
    urls: ['res/coindrop.wav']
  });

  var task;
  var current_cost = 0;
  var running = false;
  var minutes = 0;
  var seconds = 0;

  var resetCounters = function() {
    current_cost = 0;
    minutes = 0;
    seconds = 0;
  }

  var incrementTotal = function(count) {
    asyncStorage.getItem('historic', function(value) {
      value = value || 0;
      asyncStorage.setItem('historic', value + count, function() {
        renderTotal();  
      });
    });
  }

  var renderTotal = function() {
    asyncStorage.getItem('historic', function(value) {
      value = value || 0;
      document.querySelector('#total').innerHTML = value + ' minutes';
    });
  }

  var pad = function(num) {
    return (num < 10) ? '0' + num.toString() : num.toString();
  }

  var lastCoinSound = 0;
  var incrementCost = function(sec) {
    current_cost += sec * 60 / 3600; // 1 min = 1 eur (60 eur/h avg)

    var roundedCost = Math.floor(current_cost);

    if (lastCoinSound != roundedCost && roundedCost % 5 === 0) {
      lastCoinSound = roundedCost;
      coinSound.play();
    }

    document.querySelector('.current_cost').innerHTML = current_cost.toFixed(2) + ' EUR / head';
  }

  var incrementCurrentTime = function(sec) {
    seconds += sec;
    if (seconds >= 60) {
      var incMinutes = Math.floor(seconds / 60);
      minutes += incMinutes;
      seconds = seconds % 60;

      incrementTotal(incMinutes);
    }

    document.querySelector('.current_minutes').innerHTML = pad(minutes) + ':' + pad(seconds);
  }

  // TODO keep in foreground?

  var backgroundDate; // TODO asyncStorage?
  document.addEventListener('mozvisibilitychange', function mozVisChange() {
    if (running) {
      if (document.mozHidden) {
        backgroundDate = new Date();

        stopTrackingTask();
      } else {
        var currentDate = new Date();
        var secondsInBackground = (currentDate.getTime() - backgroundDate.getTime()) / 1000;
        secondsInBackground = Math.round(secondsInBackground);

        incrementCurrentTime(secondsInBackground);
        incrementCost(secondsInBackground);

        startTrackingTask();
      }
    }
  });

  var startTrackingTask = function() {
    task = setInterval(function() {
        incrementCurrentTime(1);
        incrementCost(1);
      }, 1000);
  }

  var stopTrackingTask = function() {
    clearInterval(task);
  }

  var startButton = document.querySelector('#start');
  startButton.addEventListener('click', function(e) {
    running = !running;

    if (running) {
      alarmSound.play();

      resetCounters();

      startButton.className = 'danger';
      startButton.innerHTML = 'Stop Meeting'

      startTrackingTask();
    } else {
      startButton.className = 'recommend';
      startButton.innerHTML = 'Start Meeting';      

      stopTrackingTask();
    }
  });

  renderTotal();
}());

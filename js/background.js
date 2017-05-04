// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const re = /(.*)\?project=(.*)\&token=(.*)/i
// const halfAnHour = 1800 * 1000 // in ms
const halfAnHour = 1800 // in seconds

function secondsLeft(time) {
  const now = Date.now();
  const seconds = halfAnHour - ((now - time) / 1000);
  return Math.round(seconds);
}

function secondsToDate(seconds) {
  const date = new Date(seconds * 1000).toISOString().substr(11, 8);
  return date;
}

function findGATab(project, callback) {
  chrome.storage.sync.get({
    ga_site: 'https://google-admin.corp.google.com',
  }, function(stored) {
    const ga_site = stored.ga_site;

    chrome.tabs.query({url: ga_site+'*'+project+'*', currentWindow: true}, function (tabs) {
      // should be only one of these found
      if ((tabs.length > 0) && (typeof callback === 'function')) {
        console.log('tab', tabs[0]);
        callback(tabs[0]);
      }
    });
  });
}

function checkToken(project) {
  findGATab(project, function(tab) {
    chrome.tabs.executeScript(tab.id, {
        file: "js/token_link.js",
        allFrames: true,
    });
  });
}

function createAlarm(payload) {
  const name = payload.project;

  // save alarm to local storage
  chrome.storage.local.set({
    [name]: payload // [] is used so name like 'nmiu-play' can be evaluated as property
  }, function() {
    // start the alarm
    chrome.alarms.create(name, {
      delayInMinutes: 0.1, periodInMinutes: 0.2
    });
  });
}

function clearAlarm(name) {
  chrome.alarms.get(name, function() {
    chrome.alarms.clear(name);
  });

  chrome.storage.local.get(name, function() {
    chrome.storage.local.remove(name);
  });
}

function clearAllAlarms() {
  chrome.alarms.getAll(function(alarms) {
    console.log('alarms', alarms);
    alarms.forEach(function(alarm, index) {
      clearAlarm(alarm.name);
    });
  });
}

function listAlarms() {
  chrome.alarms.getAll(function(alarms) {
    console.log('existing alarms', alarms);
  });
}

function viewLocalStorage() {
  chrome.storage.local.get(null, function(items) {
    // var allKeys = Object.keys(items);
    console.log('items in local storage', items);
  });
}

function openGAPage(project) {
  findGATab(project, function(tab) {
    chrome.tabs.update(tab.id, {active: true});
  });
}

function refreshToken(project, token) {
  console.log('refreshToken - token', token);

  // get the alarm from storage
  chrome.storage.local.get(project, function(result) {
    console.log('result', result);

    const alarm = result[project];
    const savedToken = alarm.token;

    // if the passed token is a new one, update the alarm with new token and new time
    if (token != savedToken) {
      alarm.token = token;
      alarm.time = Date.now();
      // save the alarm with the new token
      chrome.storage.local.set({
        [project]: alarm
      });
    }

    // send notification when seconds left is getting low
    if (secondsLeft(alarm.time) < 300) {
      const opt = {
        type: 'basic',
        title: project.toUpperCase(),
        message: 'Token is about to expire',
        buttons: [{
          title: "Open Google Admin >>",
        }],
        iconUrl: "image/notice.png",
      }
      chrome.notifications.create(project, opt);
      setTimeout(function() {
        chrome.notifications.clear(project, function(wasCleared){});
      }, 5000);
    }

    // check the tabs if any one of them is still on the old token
    chrome.storage.sync.get({
      pantheon_site: 'https://pantheon.corp.google.com/',
    }, function(stored) {

      const pantheon_site = stored.pantheon_site;
      // console.log('pantheon_site', pantheon_site);

      // loop through all tabs start with $pantheon_site in current window
      chrome.tabs.query({url: pantheon_site+'*', currentWindow: true}, function (tabs) {
        // since the extension click works only on a $pantheon_site tab
        // there always will be one or more tabs whose url starts with $pantheon_site
        for (var j = 0; j < tabs.length; ++j) {
          const tab = tabs[j];
          const tab_match = tab.url.match(re);

          if (tab_match) {
            // console.log('tab_match', tab_match);

            const tab_project = tab_match[2];
            const tab_token = tab_match[3];

            // console.log('tab_token', tab_token);

            if ((tab_project == project) && (!tab_token.startsWith(token))) {
              const url = tab_match[1]+'?project='+project+'&token='+token;
              chrome.tabs.update(tab.id, {url: url});
            }
          }
        }
      });
    });
  });
}

// captured the alarm from the source page and save it in local storage
chrome.extension.onRequest.addListener(function(req) {
  console.log(req);

  if (req.action == 'create_alarm') {
    createAlarm(req.payload);
    // viewLocalStorage();

  } else if (req.action == 'clear_alarm') {
    clearAlarm(req.payload.project);
    // viewLocalStorage();

  } else if (req.action == 'view_alarms') {
    listAlarms();
    viewLocalStorage();

  } else if (req.action == 'check_token') {
    refreshToken(req.payload.project, req.payload.token);

  } else {
    // do nothing
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log('Got an alarm!', alarm);
  checkToken(alarm.name);
});

chrome.notifications.onClicked.addListener(function(project) {
  console.log('Notification: ' + project + ' is clicked!');
});

chrome.notifications.onButtonClicked.addListener(function(project, buttonIndex) {
  console.log('Notification button: ' + project + ' ' + buttonIndex + ' is clicked!');
  openGAPage(project);
});

// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const timeToExpire = 1800 // 30 minites
const timeToNotify = 360 // 6 minites

function secondsLeft(time) {
  const now = Date.now();
  const seconds = timeToExpire - ((now - time) / 1000);
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

    chrome.tabs.query({
        url: ga_site+'*'+project+'*',
        currentWindow: true
      }, function (tabs) {
      // should be only one of these found
      if ((tabs.length > 0) && (typeof callback === 'function')) {
        console.log('tab', tabs[0]);
        callback(tabs[0]);
      }
    });
  });
}

function checkToken(project) {
  console.log('checkToken', project);

  // get the alarm details from local storage
  chrome.storage.local.get(project, function(result) {
    // console.log('result', result);
    const alarm = result[project];

    // send notification when seconds left is getting low
    var remainingSeconds = secondsLeft(alarm.time);

    if (remainingSeconds < timeToNotify) {
      var msg = 'Token is about to expire ('+secondsToDate(remainingSeconds)+')';
      if (remainingSeconds < 0) {
        msg = 'Token expred';
        // refreshGA(project);
      }
      const opt = {
        type: 'basic',
        title: project.toUpperCase(),
        message: msg,
        buttons: [{
          title: "Refresh Now",
        }],
        iconUrl: "image/notice.png",
      }
      chrome.notifications.create(project, opt);
      setTimeout(function() {
        chrome.notifications.clear(project, function(wasCleared){});
      }, 5000);
    }
  });
}
function openGA(project) {
  console.log('openGA', project);
  findGATab(project, function(tab) {
    chrome.tabs.update(tab.id, {active: true});
  });
}

function refreshGA(project) {
  findGATab(project, function(tab) {
    console.log('refreshGA', tab);
    chrome.tabs.reload(tab.id);
  });
}

function createAlarm(payload) {
  const project = payload.project;
  const token = payload.token;

  chrome.storage.local.set({
    [project]: payload // [] is used so project like 'nmiu-play' can be evaluated as property
  }, function() {
    // reload matched pantheon tabs
    refreshToken(project, token);
    // start the alarm
    chrome.alarms.create(project, {
      delayInMinutes: 0.1, periodInMinutes: 1
    });
  });

}

function clearAlarm(name) {
  chrome.alarms.clear(name);
  chrome.storage.local.remove(name);
}

function clearAllAlarms() {
  chrome.alarms.getAll(function(alarms) {
    console.log('alarms', alarms);
    alarms.forEach(function(alarm, index) {
      clearAlarm(alarm.name);
    });
  });
}

function refreshToken(project, token) {
  chrome.storage.sync.get({
    pantheon_site: 'https://pantheon.corp.google.com/',
  }, function(stored) {

    const pantheon_site = stored.pantheon_site;
    // console.log('pantheon_site', pantheon_site);

    // loop through all tabs to check existing pantheon pages
    chrome.tabs.query({
      url: pantheon_site+'*'+project+'*',
      currentWindow: true
    }, function (tabs) {
      tabs.forEach(function(tab, index) {
        const tab_match = tab.url.match(/token=([^&/]+)/i);
        // console.log('tab_url', tab.url);

        if (tab_match) {
          // console.log('tab_match', tab_match);
          const tab_token = tab_match[1];
          console.log('tab_token', tab_token);

          if (tab_token != token) {
            // reload the tab with new token
            chrome.tabs.update(tab.id, {
              url: tab.url.replace(tab_token, token)
            });
          }
        }
      });
    });
  });
}

// captured the alarm from the source page and save it in local storage
chrome.runtime.onMessage.addListener(function(req) {
  console.log('req', req);

  if (req.action == 'create_alarm') {
    createAlarm(req.payload);
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log('Got an alarm!', alarm);
  checkToken(alarm.name);
});

chrome.notifications.onClicked.addListener(function(project) {
  console.log('Notification: '+project+' is clicked!');
});

chrome.notifications.onButtonClicked.addListener(function(project, buttonIndex) {
  console.log('Notification button: '+project+' '+buttonIndex+' is clicked!');
  openGA(project);
  refreshGA(project);
});

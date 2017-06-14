// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const timeToExpire = 1800; // 30 minites
const timeToNotify = 360; // 6 minites
const timeToReload = 180; // 3 minutes
const timeToIgnore = -120; // -2 minutes

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
    ga_site: 'https://google-admin.corp.google.com/',
  }, function(stored) {
    const ga_site = stored.ga_site;

    chrome.storage.local.get(project, function(result) {
      const alarm = result[project];

      chrome.tabs.query({
          url: ga_site+'*'+alarm.project_number+'*',
          // currentWindow: true
        }, function (tabs) {
        // clear the alarm if no matching GA page found
        if (tabs.length == 0) {
          clearAlarm(project);
        }
        // should be only one of these found
        if ((tabs.length > 0) && (typeof callback === 'function')) {
          console.log('tab', tabs[0]);
          callback(tabs[0]);
        }
      });
    });
  });
}

function checkToken(project) {
  console.log('checkToken', project);

  // get the alarm details from local storage
  chrome.storage.local.get(project, function(result) {
    // console.log('result', result);
    const alarm = result[project];
    const remainingSeconds = secondsLeft(alarm.time);
    console.log('remainingSeconds', remainingSeconds);

    // do nothing when timeToNotify is not reached yet
    if (remainingSeconds > timeToNotify) return;

    // read the auto_reload value from synced storage
    chrome.storage.sync.get({
      auto_reload: false, // default to false
    }, function(stored) {

      // remainingSeconds is getting low
      if (remainingSeconds > timeToReload) {
        if (!stored.auto_reload) sendNotice(project, remainingSeconds);
        return;
      }

      // gave up after the token is expired for more than 2 minites
      if (remainingSeconds < timeToIgnore) {
        return;
      }

      // token expired
      if (stored.auto_reload) {
        refreshGA(project);
        sendNotice(project, remainingSeconds, 'Token expred, Google Admin page is refreshed');
      }
    });
  });
}

function sendNotice(project, remainingSeconds, message) {
    var msg = 'Token is about to expire ('+secondsToDate(remainingSeconds)+')';

    if (remainingSeconds < 0) {
      msg = 'Token expred';
    }

    var opt = {
      type: 'basic',
      title: project.toUpperCase(),
      message: msg,
      buttons: [{
        title: "Refresh Now",
      }],
      iconUrl: "image/notice.png",
    }

    // override things when extra message is passed in
    if (message) {
      opt.message = message;
      opt.buttons = [];
    }

    chrome.notifications.create(project, opt);
    setTimeout(function() {
      chrome.notifications.clear(project, function(wasCleared){});
    }, 5000);
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
  const name = payload.project;
  const token = payload.token;

  chrome.storage.local.set({
    [name]: payload // [] is used so project like 'nmiu-play' can be evaluated as property
  }, function() {
    // reload matched pantheon tabs
    refreshToken(name, token);
    // start the alarm
    chrome.alarms.create(name, {
      delayInMinutes: 0.1, periodInMinutes: 2
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
      // currentWindow: true
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

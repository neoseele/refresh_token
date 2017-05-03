// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const re = /(.*)\?project=(.*)\&token=(.*)/i
const halfAnHour = 1800 * 1000 // in ms

function secondsLeft(time) {
  const now = Date.now();
  const seconds = (halfAnHour - (now - time)) / 1000;
  return Math.round(seconds);
}

function secondsToDate(seconds) {
  const date = new Date(seconds * 1000).toISOString().substr(11, 8);
  return date;
}

function refreshToken(project, token) {
  // console.log('refreshToken - token', token);

  // get the alarm from storage
  chrome.storage.local.get(project, function(result) {
    // console.log('result', result);

    const alarm = result[project];
    const savedToken = alarm.token;

    if (token != savedToken) {
      alarm.token = token;
      alarm.time = Date.now();
      // save the alarm with the new token
      chrome.storage.local.set({
        [project]: alarm
      });
    }

    // get the saved pantheon_site
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
            const tab_project = tab_match[2];
            const tab_token = tab_match[3];

            // reload the tab when
            // * project matched
            // * token not matched

            if ((tab_project == project) && (tab_token != token)) {
              const url = tab_match[1]+'?project='+project+'&token='+token;
              chrome.tabs.update(tab.id, {url: url});
            }
          }
        }
      });
    });
  });
}

function checkToken(project) {

  chrome.storage.sync.get({
    ga_site: 'https://google-admin.corp.google.com',
  }, function(stored) {

    const ga_site = stored.ga_site;
    console.log('ga_site', ga_site);

    chrome.tabs.query({url: ga_site+'*'+project+'*', currentWindow: true}, function (tabs) {
      console.log('# of tabs', tabs.length);

      // should only be one here
      if (tabs.length > 0) {
        const tab = tabs[0];
        chrome.tabs.executeScript(tab.id, {
            file: "js/token_link.js",
            allFrames: true,
        });
      }
    });
  });

}

function createAlarm(alarm) {
  const name = alarm.project_id;

  // save alarm to local storage
  chrome.storage.local.set({
    [name]: alarm // [] is used so name can be evaluated as property
  }, function() {
    // start the alarm
    chrome.alarms.create(name, {
      delayInMinutes: 0.1, periodInMinutes: 0.5
    });
  });
}

function clearAlarm(alarm) {
  const name = alarm.project_id;

  chrome.alarms.get(name, function(a) {
    chrome.alarms.clear(a.name);
  });

  chrome.storage.local.get(name, function() {
    chrome.storage.local.remove(name);
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

// captured the alarm from the source page and save it in local storage
chrome.extension.onRequest.addListener(function(req) {
  console.log(req);

  if (req.action == 'create_alarm') {
    createAlarm(req.alarm);
    viewLocalStorage();

  } else if (req.action == 'clear_alarm') {

    clearAlarm(req.alarm);
    viewLocalStorage();

  } else if (req.action == 'view_alarms') {

    listAlarms();
    viewLocalStorage();

  } else if (req.action == 'check_token') {

    const result = req.result;
    refreshToken(result.project_id, result.token);

  } else {
    // do nothing
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log("Got an alarm!", alarm);
  checkToken(alarm.name);
});

// chrome.browserAction.onClicked.addListener(function(tab) { //Fired when User Clicks ICON
//   // get the stored pantheon_site from storage
//   chrome.storage.sync.get({
//     ga_site: 'https://google-admin.corp.google.com',
//   }, function(stored) {
//
//     ga_site = stored.ga_site;
//     // Inspect whether the place where user clicked matches with our site
//     if (tab.url.indexOf(ga_site) != -1) {
//       chrome.tabs.executeScript(tab.id, {
//           file: "token_link.js",
//           allFrames: true,
//       });
//     } else {
//       alert("Current tab's URL must be "+ga_site);
//     }
//   });
// });

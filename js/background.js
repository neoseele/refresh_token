// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const re = /(.*)\?project=(.*)\&token=(.*)/i

function secondsLeft(time) {
  const halfAnHour = 100 * 1000 // in ms
  const now = Date.now();
  const seconds = (halfAnHour - (now - time)) / 1000;
  return Math.round(seconds);
}

function secondsToDate(seconds) {
  const date = new Date(seconds * 1000).toISOString().substr(11, 8);
  return date;
}

function refreshToken(project) {
  // get the alarm detail from storage
  chrome.storage.local.get(project, function(result) {
    console.log('result', result);
    const alarmDetail = result[project];
    const newToken = alarmDetail.token;

    // get the saved pantheon_site
    chrome.storage.sync.get({
      pantheon_site: 'https://pantheon.corp.google.com/',
    }, function(stored) {

      const pantheon_site = stored.pantheon_site;

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

            if ((tab_project == project) && (tab_token != alarmDetail.token)) {
              const url = tab_match[1]+'?project='+project+'&token='+newToken;
              chrome.tabs.update(tab.id, {url: url});
            }
          }
        }
      });
    });
  });
}

function clearAlarm(alarmName) {
  chrome.alarms.get(alarmName, function(alarm) {
    chrome.alarms.clear(alarm.name);
  });

  chrome.storage.local.get(alarmName, function() {
    chrome.storage.local.remove(alarmName);
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

    const details = req.alarm;
    const alarmName = details.project_id;

    chrome.storage.local.set({
      [alarmName]: details // will evaluate alarmName as property name
    }, function() {
      chrome.alarms.create(alarmName, {
        delayInMinutes: 0.1, periodInMinutes: 0.1
      });
    });

    viewLocalStorage();

  } else if (req.action == 'clear_alarm') {


    const details = req.alarm;
    const alarmName = details.project_id;

    clearAlarm(alarmName);

    viewLocalStorage();

  } else if (req.action == 'view_alarms') {

    chrome.alarms.getAll(function(alarms) {
      console.log('existing alarms', alarms);
    });

    viewLocalStorage();

  } else {
    refresh(req.project_id);
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log("Got an alarm!", alarm);
  refreshToken(alarm.name);
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

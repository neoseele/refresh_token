// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const re = /(.*)\?project=(.*)\&token=(.*)/i
var count = 10;

function refresh(token_link) {
  // alert(token_link);

  // proceed if token_link is not null
  if (token_link) {
    const match = token_link.match(re);

    // regexp matched groups start with index 1
    const project = match[2];
    const new_token = match[3];

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

            if ((tab_project == project) && (tab_token != new_token)) {
              const url = tab_match[1]+'?project='+project+'&token='+new_token;
              chrome.tabs.update(tab.id, {url: url});
            }
          }
        }
      });
    });
  } else {
    alert('No token link found.');
  }
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

// captured the token link from the source page, assign it to a local variable
chrome.extension.onRequest.addListener(function(req) {
  console.log(req);

  if (req.action == 'create_alarm') {

    const details = req.alarm;
    const alarmName = details.project_id;

    chrome.storage.local.set({
      [alarmName]: details // will evaluate alarmName as property name
    }, function() {
      chrome.alarms.create(alarmName, {
        delayInMinutes: 0.1, periodInMinutes: 1
      });
    });

    viewLocalStorage();

  } else if (req.action == 'clear_alarm') {


    const details = req.alarm;
    const alarmName = details.project_id;

    clearAlarm(alarmName);

    count = 10; // reset counter

    viewLocalStorage();

  } else if (req.action == 'view_alarms') {

    chrome.alarms.getAll(function(alarms) {
      console.log('existing alarms', alarms);
    });

    viewLocalStorage();

    // clear all alarms
    // chrome.alarms.getAll(function(alarms) {
    //   for (var i = 0; i < alarms.length; ++i) {
    //     chrome.alarms.clear(alarms[i].name);
    //   }
    // });

  } else {
    refresh(req['link']);
  }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  count -= 1;
  console.log("Got an alarm!", alarm);
  // if (count <= 5) {
  //   alert('Token for project [' + alarm.name + '] is about to expired.');
  //   clearAlarm(alarm.name);
  // }
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

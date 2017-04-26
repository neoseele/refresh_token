// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var re = /(.*)\?project=(.*)\&token=(.*)/i

function refresh(token_link) {
  // alert(token_link);

  // proceed if token_link is not null
  if (token_link) {
    var match = token_link.match(re);

    // regexp matched groups start with index 1
    var project = match[2];
    var new_token = match[3];

    chrome.storage.sync.get({
      pantheon_site: 'https://pantheon.corp.google.com/',
    }, function(stored) {

      pantheon_site = stored.pantheon_site;

      // loop through all tabs start with $pantheon_site in current window
      chrome.tabs.query({url: pantheon_site+'*', currentWindow: true}, function (tabs) {
        // since the extension click works only on a $pantheon_site tab
        // there always will be one or more tabs whose url starts with $pantheon_site
        for (var j = 0; j < tabs.length; ++j) {
          var tab = tabs[j];
          var tab_match = tab.url.match(re);

          if (tab_match) {
            var tab_project = tab_match[2];
            var tab_token = tab_match[3];

            // reload the tab when
            // * project matched
            // * token not matched

            if ((tab_project == project) && (tab_token != new_token)) {
              var url = tab_match[1]+'?project='+project+'&token='+new_token;
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

// captured the token link from the source page, assign it to a local variable
chrome.extension.onRequest.addListener(function(req) {
  // alert('req '+req);

  if (req['action'] == 'create_alarm') {
    chrome.alarms.create(req['alarm_name'], {
      delayInMinutes: 0.1, periodInMinutes: 0.1
    });
  } else if (req['action'] == 'clear_alarm') {
    chrome.alarms.clear(req['alarm_name']);
  } else {
    refresh(req['link']);
  }
});

var count = 30;
chrome.alarms.onAlarm.addListener(function(alarm) {
  count -= 1;
  alert('Got an alarm! ' + count);
  console.log("Got an alarm!", alarm);
});

chrome.browserAction.onClicked.addListener(function (tab) { //Fired when User Clicks ICON
  // get the stored pantheon_site from storage
  chrome.storage.sync.get({
    ga_site: 'https://google-admin.corp.google.com',
  }, function(stored) {

    ga_site = stored.ga_site;
    // Inspect whether the place where user clicked matches with our site
    if (tab.url.indexOf(ga_site) != -1) {
      chrome.tabs.executeScript(tab.id, {
          file: "token_link.js",
          allFrames: true,
      });
    } else {
      alert("Current tab's URL must be "+ga_site);
    }
  });
});

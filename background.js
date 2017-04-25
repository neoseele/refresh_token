// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var default_site = 'https://pantheon.corp.google.com/';
// var default_site = 'http://localhost:4567/';
var site = null;
var re = /(.*)\?project=(.*)\&token=(.*)/i

function refresh(token_link) {
  // proceed if token_link is not null
  if (token_link) {
    var match = token_link.match(re);
    // regexp matched groups start with index 1
    var project = match[2];
    var new_token = match[3];
    // alert(project);
    // alert(new_token);

    // loop through all tabs start with $site in current window
    chrome.tabs.query({url: site+'*', currentWindow: true}, function (tabs) {
      // since the extension click works only on a $site tab
      // there always will be one or more tabs whose url starts with $site
      for (var j = 0; j < tabs.length; ++j) {
        var tab = tabs[j];
        var tab_match = tab.url.match(re);

        if (tab_match) {
          // only refresh the tabs whose url related to token_link's $project
          if (tab_match[2] == project) {
            var new_url = tab_match[1]+'?project='+project+'&token='+new_token;
            chrome.tabs.update(tab.id, {url: new_url});
            // chrome.tabs.reload(tabs[j].id);
          }
        }
      }
    });
  } else {
    alert('No token link found.');
  }
}

// captured the token link from the source page, assign it to a local variable
chrome.extension.onRequest.addListener(function(link) {
  alert('site:'+site);
  refresh(link);
});

chrome.browserAction.onClicked.addListener(function (tab) { //Fired when User Clicks ICON
  // get the stored site from storage
  chrome.storage.sync.get({
    site: default_site, // if no site parameter stored, use the default one
  }, function(stored) {
    site = stored.site;

    // Inspect whether the place where user clicked matches with our site
    if (tab.url.indexOf(site) != -1) {
      chrome.tabs.executeScript(tab.id, {
          file: "token_link.js",
          allFrames: true,
      });
    } else {
      alert('This extension only works on:'+site);
    }
  });
});

// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var allLinks = [];
var visibleLinks = [];

// Display all visible links.
function showLinks() {
  var linksTable = document.getElementById('links');
  while (linksTable.children.length > 1) {
    linksTable.removeChild(linksTable.children[linksTable.children.length - 1])
  }
  for (var i = 0; i < visibleLinks.length; ++i) {
    var row = document.createElement('tr');
    var col0 = document.createElement('td');
    var col1 = document.createElement('td');
    var checkbox = document.createElement('input');
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.id = 'check' + i;
    col0.appendChild(checkbox);
    col1.innerText = visibleLinks[i];
    col1.style.whiteSpace = 'nowrap';
    col1.onclick = function() {
      checkbox.checked = !checkbox.checked;
    }
    row.appendChild(col0);
    row.appendChild(col1);
    linksTable.appendChild(row);
  }
}

// Toggle the checked state of all visible links.
function toggleAll() {
  var checked = document.getElementById('toggle_all').checked;
  for (var i = 0; i < visibleLinks.length; ++i) {
    document.getElementById('check' + i).checked = checked;
  }
}

function reload() {
  // console.log('# of visible Links:' + visibleLinks.length);

  for (var i = 0; i < visibleLinks.length; ++i) {
    var link = visibleLinks[i];
    var match = link.match(/(.*)token=.*/);
    var link_prefix = match[1];
    // console.log(link_prefix);

    if (document.getElementById('check' + i).checked) {
      chrome.tabs.query({url: link_prefix+'*', currentWindow: true},
                        function (arrayOfTabs) {
        if (arrayOfTabs.length == 0) {
          // console.log('visible link:' + link);
          chrome.tabs.create({url: link}, function(id) {});

        } else {
          // console.log(arrayOfTabs.length);
          for (var j = 0; j < arrayOfTabs.length; ++j) {
            // console.log('tab id:' + arrayOfTabs[j].id);
            // console.log('tab url:' + arrayOfTabs[j].url);

            chrome.tabs.update(arrayOfTabs[j].id, {url: link});
            // chrome.tabs.reload(arrayOfTabs[j].id);
          }
        }
      });
    }
  }
  window.close();
}

// Add links to allLinks and visibleLinks, sort and show them. token_links.js is
// injected into all frames of the active tab, so this listener may be called
// multiple times.
chrome.extension.onRequest.addListener(function(links) {
  for (var index in links) {
    allLinks.push(links[index]);
  }
  allLinks.sort();
  visibleLinks = allLinks;
  showLinks();
});

// Set up event handlers and inject token_links.js into all frames in the active
// tab.
window.onload = function() {
  document.getElementById('toggle_all').onchange = toggleAll;
  document.getElementById('reload').onclick = reload;

  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({active: true, windowId: currentWindow.id},
                      function(activeTabs) {
      chrome.tabs.executeScript(
        activeTabs[0].id, {file: 'token_links.js', allFrames: true});
    });
  });
};

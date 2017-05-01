// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This extension demonstrates using chrome.downloads.download() to
// download URLs.

var alarms = [];
var bgPage = chrome.extension.getBackgroundPage();

// Display all alarms
function showAlarms() {
  var alarmsTable = document.getElementById('alarms');
  while (alarmsTable.children.length > 1) {
    alarmsTable.removeChild(alarmsTable.children[alarmsTable.children.length - 1])
  }
  for (var i = 0; i < alarms.length; ++i) {
    var a = alarms[i];

    var row = document.createElement('tr');

    var col0 = document.createElement('td');
    var col1 = document.createElement('td');
    var col2 = document.createElement('td');
    var col3 = document.createElement('td');

    var checkbox = document.createElement('input');
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.id = 'check' + i;

    var button = document.createElement('button');
    button.id = 'button' + i;
    button.innerHTML = 'button' + i;

    var now = Date.now();

    if ((now - a.time) > 60000) {
      button.disabled = false;
      button.onclick = function() {
        // alert('button'+i);
        chrome.tabs.query({url: a.ga_link, currentWindow: true}, function (tabs) {
          // should be only one of these found
          if (tabs.length > 0) {
            const tab = tabs[0];
            chrome.tabs.update(tab.id, {active: true});
          }
        });
      }
    } else {
      button.disabled = true;
    }

    col0.appendChild(checkbox);
    col1.innerText = alarms[i].project_id;
    col1.style.whiteSpace = 'nowrap';
    col1.onclick = function() {
      checkbox.checked = !checkbox.checked;
    }
    col2.innerText = alarms[i].time
    col3.appendChild(button);

    row.appendChild(col0);
    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3);
    alarmsTable.appendChild(row);
  }
}

// Toggle the checked state of all alarms.
function toggleAll() {
  var checked = document.getElementById('toggle_all').checked;
  for (var i = 0; i < alarms.length; ++i) {
    document.getElementById('check' + i).checked = checked;
  }
}

// Clear all alarms
function clearAll() {
  for (var i = 0; i < alarms.length; ++i) {
    if (document.getElementById('check' + i).checked) {
      bgPage.clearAlarm(alarms[i].project_id);
    }
  }
  window.close();
}

// Set up event handlers and inject send_links.js into all frames in the active
// tab.
window.onload = function() {
  document.getElementById('toggle_all').onchange = toggleAll;
  document.getElementById('clear_all').onclick = clearAll;

  chrome.storage.local.get(null, function(result) {
    alarms = Object.values(result);
    console.log('alarms', alarms);
    showAlarms();
  });
};

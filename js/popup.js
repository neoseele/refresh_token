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
    var alarm = alarms[i];

    var row = document.createElement('tr');

    var col0 = document.createElement('td');
    var col1 = document.createElement('td');
    var col2 = document.createElement('td');
    var col3 = document.createElement('td');

    var checkbox = document.createElement('input');
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.id = 'check' + i;

    var button0 = document.createElement('button');
    button0.id = 'button' + i;

    col0.appendChild(checkbox);
    col1.innerText = alarm.project;
    col1.style.whiteSpace = 'nowrap';
    col1.onclick = function() {
      checkbox.checked = !checkbox.checked;
    }

    var secondsLeft = bgPage.secondsLeft(alarm.time);
    if (secondsLeft > 0) {
      col2.innerText = bgPage.secondsToDate(secondsLeft);

      button0.innerHTML = 'Refresh';
      button0.onclick = function() {
        bgPage.checkToken(alarm.project);
        window.close();
      }

    } else {
      col2.innerText = 'expired';

      button0.innerHTML = 'Google Admin';
      button0.onclick = bgPage.openGAPage(alarm.project);
    }

    col3.appendChild(button0);

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

// Clear selected alarms
function clear() {
  for (var i = 0; i < alarms.length; ++i) {
    if (document.getElementById('check' + i).checked) {
      bgPage.clearAlarm(alarms[i].project);
    }
  }
  window.close();
}

// Clear all alarms
function clearAll() {
  bgPage.clearAllAlarms();
  window.close();
}

// Set up event handlers and inject send_links.js into all frames in the active
// tab.
window.onload = function() {
  document.getElementById('toggle_all').onchange = toggleAll;
  document.getElementById('clear').onclick = clear;
  document.getElementById('clear_all').onclick = clearAll;

  chrome.storage.local.get(null, function(result) {
    // load the existing alarm payloads
    alarms = Object.values(result);
    // console.log('alarms', alarms);
    showAlarms();
  });
};

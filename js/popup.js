// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

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

    col0.innerText = alarm.project;

    // button0
    var button0 = document.createElement('button');
    button0.id = 'button0' + i;

    var secondsLeft = bgPage.secondsLeft(alarm.time);
    if (secondsLeft > 0) {
      col1.innerText = bgPage.secondsToDate(secondsLeft);

      button0.innerHTML = 'Refresh';
      button0.onclick = function() {
        bgPage.checkToken(alarm.project);
        window.close();
      }

    } else {
      col1.innerText = 'expired';

      button0.innerHTML = 'Google Admin';
      button0.onclick = bgPage.openGAPage(alarm.project);
    }

    // button1
    var button1 = document.createElement('button');
    button1.id = 'button1' + i;
    button1.innerHTML = 'Clear';
    button1.onclick = function() {
      bgPage.clearAlarm(alarm.project);
      window.close();
    }

    col2.appendChild(button0);
    col2.appendChild(button1);

    row.appendChild(col0);
    row.appendChild(col1);
    row.appendChild(col2);

    alarmsTable.appendChild(row);
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

window.onload = function() {
  document.getElementById('clear_all').onclick = clearAll;

  chrome.storage.local.get(null, function(result) {
    // load the existing alarm payloads
    alarms = Object.values(result);
    // console.log('alarms', alarms);
    showAlarms();
  });
};

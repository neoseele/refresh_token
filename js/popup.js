// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var alarms = [];
var bgPage = chrome.extension.getBackgroundPage();

// Display all alarms
function showAlarms() {
  var ulAlarms = document.getElementById('alarms');
  var btnClear = document.getElementById('clear');

  while (ulAlarms.children.length > 1) {
    ulAlarms.removeChild(ulAlarms.children[alarmsTable.children.length - 1])
  }

  if (alarms.length > 0) {
    btnClear.style.display = 'inline-block';
  } else {
    var li = document.createElement('li');
    li.className = 'mdl-list__item';
    li.innerText = 'No alarm found';
    ulAlarms.appendChild(li);
    return;
  }

  for (var i = 0; i < alarms.length; ++i) {
    var alarm = alarms[i];

    var li = document.createElement('li');
    li.className = 'mdl-list__item mdl-list__item--two-line';

    var spanPrimaryContent = document.createElement('span');
    spanPrimaryContent.className = 'mdl-list__item-primary-content';

    var icon = document.createElement('i');
    icon.className = 'material-icons mdl-list__item-icon';
    icon.innerText = 'alarm';

    var spanAlarm = document.createElement('span');
    spanAlarm.innerText = alarm.project;
    spanAlarm.className = 'alarm';
    spanAlarm.onclick = (function() {
      const project = alarm.project;
      return function() {
        bgPage.openGAPage(project);
      }
    })();

    var spanAlarmDetail = document.createElement('span');
    spanAlarmDetail.className = 'mdl-list__item-sub-title';
    spanAlarmDetail.innerText = alarm.project;

    var spanSecondaryContent = document.createElement('span');
    spanSecondaryContent.className = 'mdl-list__item-secondary-content';

    // var spanActions = document.createElement('span');
    // spanActions.className = 'mdl-list__item-secondary-info';
    // spanActions.innerText = 'Action';

    // refresh button
    var button0 = document.createElement('button');
    button0.id = 'button0' + i;

    var secondsLeft = bgPage.secondsLeft(alarm.time);
    spanAlarmDetail.innerText = bgPage.secondsToDate(secondsLeft);

    button0.innerHTML = '<i class="material-icons">cached</i>';
    button0.className = 'mdl-button mdl-js-button mdl-button--icon';
    button0.onclick = (function() {
      const project = alarm.project;
      return function() {
        bgPage.checkToken(project);
        window.close();
      }
    })();

    // disable refresh button when the token is already expired
    if (secondsLeft < 0) {
      spanAlarmDetail.innerText = 'Expired';
      // button0.disabled = true;
    }

    // delete button
    var button1 = document.createElement('button');
    button1.id = 'button1' + i;
    button1.innerHTML = '<i class="material-icons">delete</i>';
    button1.className = 'mdl-button mdl-js-button mdl-button--icon';
    button1.onclick = (function() {
      const project = alarm.project;
      return function() {
        bgPage.clearAlarm(project);
        window.close();
      }
    })();

    spanPrimaryContent.appendChild(icon);
    spanPrimaryContent.appendChild(spanAlarm);
    spanPrimaryContent.appendChild(spanAlarmDetail);

    // spanSecondaryContent.appendChild(spanActions);
    spanSecondaryContent.appendChild(button0);
    spanSecondaryContent.appendChild(button1);

    li.appendChild(spanPrimaryContent);
    li.appendChild(spanSecondaryContent);

    ulAlarms.appendChild(li);
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
  document.getElementById('clear').onclick = clearAll;

  chrome.storage.local.get(null, function(result) {
    // load the existing alarm payloads
    alarms = Object.values(result);
    // console.log('alarms', alarms);
    showAlarms();
  });
};

/**
 * a place to store all the alarms
 */
let alarms = [];

/**
 * a reference to the background page
 */
const bgPage = chrome.extension.getBackgroundPage();

/**
 * Display all alarms
 */
function showAlarms() {
  let ulAlarms = document.getElementById('alarms');
  let btnClear = document.getElementById('clear');

  while (ulAlarms.children.length > 1) {
    ulAlarms.removeChild(ulAlarms.children[alarmsTable.children.length - 1]);
  }

  if (alarms.length > 0) {
    btnClear.style.display = 'inline-block';
    btnClear.title = 'clear all tokens';
  } else {
    let li = document.createElement('li');
    li.className = 'mdl-list__item';
    li.innerText = 'No active tokens found';
    ulAlarms.appendChild(li);
    return;
  }

  for (let i = 0; i < alarms.length; ++i) {
    let alarm = alarms[i];
    const projectName = alarm.projectName;

    let li = document.createElement('li');
    li.className = 'mdl-list__item mdl-list__item--two-line';

    let spanPrimaryContent = document.createElement('span');
    spanPrimaryContent.className = 'mdl-list__item-primary-content';

    let icon = document.createElement('i');
    icon.className = 'material-icons mdl-list__item-icon';
    icon.innerText = 'alarm';

    let spanAlarm = document.createElement('span');
    spanAlarm.innerText = alarm.projectName;
    spanAlarm.className = 'alarm';
    spanAlarm.onclick = function() {
      bgPage.openGA(projectName);
      window.close();
    };

    let spanAlarmDetail = document.createElement('span');
    spanAlarmDetail.className = 'mdl-list__item-sub-title';
    spanAlarmDetail.innerText = alarm.projectName;

    let spanSecondaryContent = document.createElement('span');
    spanSecondaryContent.className = 'mdl-list__item-secondary-content';

    // refresh button
    let button0 = document.createElement('button');
    button0.id = 'button0' + i;

    let secondsLeft = bgPage.secondsLeft(alarm.time);
    spanAlarmDetail.innerText = bgPage.secondsToDate(secondsLeft);

    button0.innerHTML = '<i class="material-icons">autorenew</i>';
    button0.className = 'mdl-button mdl-js-button mdl-button--icon';
    button0.title = 'renew this token';
    button0.onclick = function() {
      bgPage.refreshGA(projectName);
      window.close();
    };

    // disable refresh button when the token is already expired
    if (secondsLeft < 0) {
      spanAlarmDetail.innerText = 'Expired';
      // button0.disabled = true;
    }

    // delete button
    let button1 = document.createElement('button');
    button1.id = 'button1' + i;
    button1.innerHTML = '<i class="material-icons">delete</i>';
    button1.className = 'mdl-button mdl-js-button mdl-button--icon';
    button1.title = 'discard this token';
    button1.onclick = function() {
      bgPage.clearAlarm(projectName);
      window.close();
    };

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

/**
 * Clear selected alarms
 */
function clear() {
  for (let i = 0; i < alarms.length; ++i) {
    if (document.getElementById('check' + i).checked) {
      bgPage.clearAlarm(alarms[i].name);
    }
  }
  window.close();
}

/**
 * Clear all alarms
 */
function clearAll() {
  bgPage.clearAllAlarms();
  window.close();
}

/**
 * called when the popup is loaded
 */
window.onload = function() {
  document.getElementById('clear').onclick = clearAll;

  chrome.storage.local.get(null, function(storageItems) {
    // load the existing alarm payloads
    alarms = Object.values(storageItems);
    showAlarms();
  });
};

/**
 * @fileoverview Background page token refresher
 * @author nmiu@google.com (Neil Miao)
 */

const timeToExpire = 30;  // token expiry in mins
// token expiry warning at timeToExpire - timeToNotify (mins)
const timeToNotify = 2;
const notificationLength = 10;  // seconds to show notification popup

/**
 * How many seconds left until token expired
 * @param {number} time in milliseonds since epoch
 * @return {number} number of seconds before token expired
 */
function secondsLeft(time) {
  const now = Date.now();
  const seconds = (timeToExpire * 60) - ((now - time) / 1000);
  return Math.round(seconds);
}

/**
 * convert seconds to human readable string
 * @param {number} seconds
 * @return {string} human readable form of the seconds
 */
function secondsToDate(seconds) {
  return new Date(seconds * 1000).toISOString().substr(11, 8);
}

/**
 * find the Google Admin tab by project name
 * convert projectName to projectNumber, refresh it and all linked PA tabs
 * @param {string} projectName project name
 * @param {function(int): undefined} callback function when the tab is found
 */
function findGATab(projectName, callback) {
  chrome.storage.local.get(projectName, (storageItems) => {
    const alarm = storageItems[projectName];

    chrome.tabs.query(
      {url: URL_BASES.google_admin + '*' + alarm.projectNumber + '*'},
      function searchGoogleAdminTabs(tabs) {
        // should be only one of these found
        if ((tabs.length > 0) && (typeof callback === 'function')) {
          callback(tabs[0]);
        }

        // discard the alarm if no matching GA page found
        if (tabs.length == 0) clearAlarm(projectName);
      }
    );
  });
}

/**
 * check if the token of a given project is about to expire
 * and do things accordingly
 * @param {string} projectName project name
 */
function checkToken(projectName) {
  // get the alarm details from local storage
  chrome.storage.local.get(projectName, (storageItems) => {

    const remainingSeconds = secondsLeft(storageItems[projectName].time);

    // do nothing when timeToNotify is not reached yet
    if (remainingSeconds > timeToNotify * 60) return;

    // remainingSeconds is getting low
    if (remainingSeconds > 0) {
      sendNotice(projectName, remainingSeconds);
      return;
    }

    // gave up after the token is expired for more than 2 minites
    if (remainingSeconds > -120) return;
  });
}

/**
 * send chrome notice
 * @param {string} projectName project name
 * @param {number} remainingSeconds seconds until the token expired
 * @param {string} message extra messages to notify user(optional)
 */
function sendNotice(projectName, remainingSeconds, message) {
  let msg =
      'Token is about to expire (' + secondsToDate(remainingSeconds) + ')';

  if (remainingSeconds < 0) {
    msg = 'Token expired';
  }

  let opt = {
    type: 'basic',
    title: projectName.toUpperCase(),
    message: msg,
    buttons: [{
      title: 'Refresh Now',
    }],
    iconUrl: 'image/notice.png',
  };

  // override things when extra message is passed in
  if (message) {
    opt.message = message;
    opt.buttons = [];
  }

  chrome.notifications.create(projectName, opt);
  setTimeout(() => {
    chrome.notifications.clear(projectName, (wasCleared) => {});
  }, notificationLength * 1000);
}

/**
 * find the project's Google Admin tab and switch to it
 * @param {string} projectName project name
 */
function openGA(projectName) {
  findGATab(projectName, (tab) => {
    chrome.tabs.update(tab.id, {active: true});
  });
}

/**
 * reload the pantheon tabs when the token is refreshed
 * @param {string} projectName project name
 * @param {string} newToken the new token
 */
function refreshToken(projectName, newToken) {
  // loop through all tabs to check existing pantheon pages
  chrome.tabs.query(
    {url: URL_BASES.pantheon + '*' + projectName + '*'}, (tabs) => {
      for (const tab of tabs) {
        const tabMatch = tab.url.match(/token=([^&/]+)/i);

        if (tabMatch) {
          const tabToken = tabMatch[1];

          if (tabToken != newToken) {
            // reload the tab with new token
            chrome.tabs.update(
                tab.id, {url: tab.url.replace(tabToken, newToken)});
          }
        }
      }
    });
}

/**
 * find the project's Google Admin tab and refresh it, called from
 * content-script
 * @param {string} projectName project id
 */
function refreshGA(projectName) {
  findGATab(projectName, (tab) => {
    // switch to the GA page
    chrome.tabs.update(tab.id, {active: true}, () => {
      // then reload it
      chrome.tabs.reload(tab.id);
    });
  });
}

/**
 * create a chrome alarm with the given payload
 * @param {!Payload} payload payload from content script message
 */
function createAlarm(payload) {
  const projectName = payload.projectName;
  const token = payload.token;

  chrome.storage.local.set(
      {
        // [] is used so name like 'nmiu-play' can be evaluated as property
        [projectName]: payload
      },
      () => {
        // reload matched pantheon tabs
        refreshToken(projectName, token);
        // start the alarm
        chrome.alarms.create(projectName, {delayInMinutes: 0.1, periodInMinutes: 2});
      });
}

/**
 * clear an alarm and delete it from local storage
 * @param {string} name: alarm name
 */
function clearAlarm(alarmName) {
  chrome.alarms.clear(alarmName);
  chrome.storage.local.remove(alarmName);
}

/**
 * clear all alarms
 */
function clearAllAlarms() {
  chrome.alarms.getAll((alarms) => {
    for (const alarm of alarms) {
      clearAlarm(alarm.name);
    }
  });
}

// capture the alarm from the source page and save it in local storage
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action == 'create_alarm') {
    createAlarm(msg.payload);
  }
});

// when an alarm has elapsed
chrome.alarms.onAlarm.addListener((alarm) => {
  checkToken(alarm.name);
  findGATab(alarm.name);
});

chrome.notifications.onButtonClicked.addListener((notificationId) => {
  refreshGA(notificationId);
});

chrome.notifications.onClicked.addListener((notificationId) => {
  openGA(notificationId);
});

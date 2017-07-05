/**
 * @fileoverview Background page used for the chrome extension
 * @author nmiu@google.com (Neil Miao)
 */

/**
 * Token expired after 30 minutes
 */
const timeToExpire = 1800;  // 30 minites

/**
 * Notify when token is going to expired in 6 minutes
 */
const timeToNotify = 360;  // 6 minites

/**
 * How many seconds left until token expired
 * @param {number} time: in milliseonds
 * @return {number} number of seconds before token expired
 */
function secondsLeft(time) {
  const now = Date.now();
  const seconds = timeToExpire - ((now - time) / 1000);
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
 * find the Google Admin tab by project id, and do something about it
 * @param {string} project: project id
 * @param {function()} callback: callback function when the tab is found
 */
function findGATab(project, callback) {
  chrome.storage.sync.get(
      {
        ga_site: 'https://google-admin.corp.google.com/',
      },
      function(stored) {
        const gaSite = stored.ga_site;

        chrome.storage.local.get(project, function(result) {
          const alarm = result[project];

          chrome.tabs.query(
              {
                url: gaSite + '*' + alarm.project_number + '*',
              },
              function(tabs) {
                // should be only one of these found
                if ((tabs.length > 0) && (typeof callback === 'function')) {
                  console.log('tab', tabs[0]);
                  callback(tabs[0]);
                }
              });
        });
      });
}

/**
 * check if the token of a given project is about to expired
 * and do things accordingly
 * @param {string} project: project id
 */
function checkToken(project) {
  console.log('checkToken', project);

  // get the alarm details from local storage
  chrome.storage.local.get(project, function(result) {
    // console.log('result', result);

    let alarm = result[project];
    let remainingSeconds = secondsLeft(alarm.time);

    // do nothing when timeToNotify is not reached yet
    if (remainingSeconds > timeToNotify) return;

    // read the auto_reload value from synced storage
    chrome.storage.sync.get(
        {
          auto_reload: false,  // default to false
        },
        function(stored) {

          // remainingSeconds is getting low
          if (remainingSeconds > 0) {
            if (!stored.auto_reload) sendNotice(project, remainingSeconds);
            return;
          }

          // gave up after the token is expired for more than 2 minites
          if (remainingSeconds > -120) {
            return;
          }

          // token expired
          if (stored.auto_reload) {
            refreshGA(project);
            sendNotice(
                project, remainingSeconds,
                'Token expred, Google Admin page is refreshed');
          }
        });
  });
}

/**
 * send chrome notice
 * @param {string} project: project id
 * @param {number} remainingSeconds: seconds until the token expired
 * @param {string} message: extra messages to notify user(optional)
 */
function sendNotice(project, remainingSeconds, message) {
  let msg =
      'Token is about to expire (' + secondsToDate(remainingSeconds) + ')';

  if (remainingSeconds < 0) {
    msg = 'Token expred';
  }

  let opt = {
    type: 'basic',
    title: project.toUpperCase(),
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

  chrome.notifications.create(project, opt);
  setTimeout(function() {
    chrome.notifications.clear(project, function(wasCleared) {});
  }, 5000);
}

/**
 * find the project's Google Admin tab and switch to it
 * @param {string} project: project id
 */
function openGA(project) {
  console.log('openGA', project);
  findGATab(project, function(tab) {
    chrome.tabs.update(tab.id, {active: true});
  });
}

/**
 * find the project's Google Admin tab and refresh it
 * @param {string} project: project id
 */
function refreshGA(project) {
  findGATab(project, function(tab) {
    console.log('refreshGA', tab);
    // switch to the GA page
    chrome.tabs.update(tab.id,  {active: true}, function() {
      // then reload it
      chrome.tabs.reload(tab.id);
    });
  });
}

/**
 * create a chrome alarm with the given payload
 * @param {object} payload: the payload consist of project id, token and some urls
 */
function createAlarm(payload) {
  const name = payload.project;
  const token = payload.token;

  chrome.storage.local.set(
      {
        [name]: payload  // [] is used so name like 'nmiu-play' can be
                         // evaluated as property
      },
      function() {
        // reload matched pantheon tabs
        refreshToken(name, token);
        // start the alarm
        chrome.alarms.create(name, {delayInMinutes: 0.1, periodInMinutes: 2});
      });
}

/**
 * clear an alarm and delete it from local storage
 * @param {string} name: alarm name
 */
function clearAlarm(name) {
  chrome.alarms.clear(name);
  chrome.storage.local.remove(name);
}

/**
 * clear all alarms
 */
function clearAllAlarms() {
  chrome.alarms.getAll(function(alarms) {
    console.log('alarms', alarms);
    alarms.forEach(function(alarm, index) {
      clearAlarm(alarm.name);
    });
  });
}

/**
 * reload the pantheon tabs when the token is refreshed
 * @param {string} project: project id
 * @param {string} newtoken: the new token
 */
function refreshToken(project, newtoken) {
  chrome.storage.sync.get(
      {
        pantheon_site: 'https://pantheon.corp.google.com/',
      },
      function(stored) {

        const pantheon_site = stored.pantheon_site;

        // loop through all tabs to check existing pantheon pages
        chrome.tabs.query(
            {
              url: pantheon_site + '*' + project + '*',
              // currentWindow: true
            },
            function(tabs) {
              tabs.forEach(function(tab, index) {
                const tab_match = tab.url.match(/token=([^&/]+)/i);

                if (tab_match) {
                  const tab_token = tab_match[1];

                  if (tab_token != newtoken) {
                    // reload the tab with new token
                    chrome.tabs.update(
                        tab.id, {url: tab.url.replace(tab_token, newtoken)});
                  }
                }
              });
            });
      });
}

// capture the alarm from the source page and save it in local storage
chrome.runtime.onMessage.addListener(function(req) {

  if (req.action == 'create_alarm') {
    console.log("Payload", req.payload);
    createAlarm(req.payload);
  }
});

// when an alarm has elapsed
chrome.alarms.onAlarm.addListener(function(alarm_msg) {
  console.log('Got an alarm!', alarm_msg);
  checkToken(alarm_msg.name);
});

// Saves options to chrome.storage
function save_options() {
  const pantheon_site = document.getElementById('pantheon_site').value;
  const ga_site = document.getElementById('ga_site').value;
  const auto_reload = document.getElementById('auto_reload').checked;
  console.log('auto_reload', auto_reload);
  chrome.storage.sync.set({
    pantheon_site: pantheon_site,
    ga_site: ga_site,
    auto_reload: auto_reload,
  }, function() {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value for site
  chrome.storage.sync.get({
    pantheon_site: 'https://pantheon.corp.google.com/',
    ga_site: 'https://google-admin.corp.google.com/',
    auto_reload: false,
  }, function(result) {
    console.log('result', result);

    document.getElementById('pantheon_site').value = result.pantheon_site;
    document.getElementById('ga_site').value = result.ga_site;

    if (result.auto_reload) {
      document.getElementById('auto_reload').checked = true;
      document.querySelector('.mdl-js-checkbox').MaterialCheckbox.check()
    }
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

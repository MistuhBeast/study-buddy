// update options
document.getElementById('saveButton').addEventListener('click', function() {
    const apiKey = document.getElementById('apiKeyInput').value;
    chrome.storage.sync.set({ 'openAIApiKey': apiKey }, function() {
      console.log('API key saved:', apiKey);
      const currentTab = chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id);
      });
    });
  });

// load saved options
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get('openAIApiKey', function(data) {
        const apiKey = data.openAIApiKey;
        console.log(data);
        console.log(apiKey);
        if (apiKey) {
            document.getElementById('apiKeyInput').value = apiKey;
        }
        else {
            document.getElementById('apiKeyInput').value = "Put your OPEN AI key here.";

        }
    });
});
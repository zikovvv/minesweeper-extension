let activeWindowId = null;

chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        url: 'game.html',
        type: 'popup',
        width: 400,
        height: 450,
        state: 'normal'
    });
});

chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === activeWindowId) {
        activeWindowId = null;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'resizeWindow' && sender.tab) {
        chrome.windows.update(sender.tab.windowId, {
            width: request.width,
            height: request.height,
            state: 'normal'  // Ensure window isn't maximized
        });
    }
});
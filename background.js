chrome.action.onClicked.addListener(() => {
  // Window size calculation:
  // Width: 20 cells * 28px + 6px total margin/padding = 566px
  // Height: 28px controls + 20 cells * 28px + 8px total margin/padding = 596px
  chrome.windows.create({
    url: 'game.html',
    type: 'popup',
    width: 566,
    height: 596
  });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CREATE_BLOB_URL') {
    const blob = new Blob([message.content], { type: 'text/markdown;charset=utf-8' });
    sendResponse({ url: URL.createObjectURL(blob) });
    return false;
  }

  if (message?.type === 'REVOKE_BLOB_URL') {
    URL.revokeObjectURL(message.url);
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

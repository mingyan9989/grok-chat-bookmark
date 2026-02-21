chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'EXTRACT_GROK_CHAT') {
    return false;
  }

  try {
    const chat = extractCurrentChat();
    sendResponse({ ok: true, chat });
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  }

  return true;
});

function extractCurrentChat() {
  const title = getChatTitle();
  const url = window.location.href;
  const nodes = findMessageNodes();

  if (!nodes.length) {
    throw new Error('No visible conversation blocks were found.');
  }

  const messages = normalizeMessages(nodes);
  if (!messages.length) {
    throw new Error('Conversation extraction returned empty content.');
  }

  return {
    title,
    url,
    messages
  };
}

function getChatTitle() {
  const titleCandidates = [
    document.querySelector('h1'),
    document.querySelector('[data-testid="conversation-title"]'),
    document.querySelector('main h2')
  ];

  for (const node of titleCandidates) {
    const text = cleanText(node?.innerText || '');
    if (text) {
      return text.slice(0, 120);
    }
  }

  const pageTitle = cleanText(document.title || '').replace(/\s*\|\s*Grok\s*$/i, '');
  return pageTitle || 'Grok Chat';
}

function findMessageNodes() {
  const selectors = [
    '[data-testid*="message"]',
    '[data-testid*="conversation"] [role="article"]',
    '[data-testid*="conversation"] [role="listitem"]',
    'main article',
    'main [role="article"]',
    'main [class*="message"]',
    'main [class*="turn"]'
  ];

  const nodes = [];
  const seen = new Set();

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (!node.offsetParent) {
        return;
      }

      const key = node.dataset?.testid || node.innerText?.slice(0, 200) || String(nodes.length);
      if (seen.has(key)) {
        return;
      }

      const text = cleanText(node.innerText || '');
      if (!isUsefulText(text)) {
        return;
      }

      seen.add(key);
      nodes.push(node);
    });
  });

  if (nodes.length > 0) {
    return nodes;
  }

  const main = document.querySelector('main');
  if (!main) {
    return [];
  }

  const chunks = cleanText(main.innerText || '')
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter((line) => line.length > 30)
    .slice(0, 40);

  return chunks.map((chunk) => {
    const div = document.createElement('div');
    div.innerText = chunk;
    return div;
  });
}

function normalizeMessages(nodes) {
  const messages = [];
  const seenText = new Set();
  let nextFallbackRole = 'user';

  nodes.forEach((node) => {
    const rawText = cleanText(node.innerText || '');
    if (!isUsefulText(rawText)) {
      return;
    }

    const text = rawText.slice(0, 12000);
    if (seenText.has(text)) {
      return;
    }

    seenText.add(text);

    let role = inferRole(node);
    if (!role) {
      role = nextFallbackRole;
      nextFallbackRole = nextFallbackRole === 'user' ? 'assistant' : 'user';
    }

    messages.push({ role, text });
  });

  return compactConsecutive(messages);
}

function inferRole(node) {
  const probes = [
    node,
    node.parentElement,
    node.closest('[data-testid]'),
    node.closest('[role="article"]')
  ].filter(Boolean);

  const bag = probes
    .map((n) => {
      const cls = typeof n.className === 'string' ? n.className : '';
      return [
        n.getAttribute?.('data-testid') || '',
        n.getAttribute?.('aria-label') || '',
        n.getAttribute?.('data-author-role') || '',
        cls
      ].join(' ');
    })
    .join(' ')
    .toLowerCase();

  if (/assistant|grok|model|ai|bot/.test(bag)) {
    return 'assistant';
  }
  if (/user|human|you|me/.test(bag)) {
    return 'user';
  }

  const head = cleanText(node.innerText || '').split('\n')[0].toLowerCase();
  if (/^grok\b|^assistant\b/.test(head)) {
    return 'assistant';
  }
  if (/^you\b|^me\b|^user\b/.test(head)) {
    return 'user';
  }

  return null;
}

function compactConsecutive(messages) {
  if (!messages.length) {
    return [];
  }

  const out = [messages[0]];

  for (let i = 1; i < messages.length; i += 1) {
    const prev = out[out.length - 1];
    const cur = messages[i];

    if (prev.role === cur.role) {
      prev.text = `${prev.text}\n\n${cur.text}`.trim();
    } else {
      out.push(cur);
    }
  }

  return out;
}

function cleanText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
}

function isUsefulText(text) {
  if (!text || text.length < 8) {
    return false;
  }

  const noise = /^(share|copy|edit|retry|regenerate|like|dislike|delete)$/i;
  if (noise.test(text)) {
    return false;
  }

  return true;
}

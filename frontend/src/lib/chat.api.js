const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:4000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

async function handleInvalidToken(res) {
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body?.error === 'Invalid token' && typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/auth/login';
      return true;
    }
  }
  return false;
}

export async function listChatSessions() {
  const res = await fetch(`${API_BASE}/api/chat/sessions`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (await handleInvalidToken(res)) return;
  if (!res.ok) throw new Error('Failed to load sessions');
  return res.json();
}

export async function createChatSession() {
  const res = await fetch(`${API_BASE}/api/chat/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (await handleInvalidToken(res)) return;
  if (!res.ok) throw new Error('Failed to create session');
  return res.json(); // { sessionId }
}

export async function getChatHistory(sessionId) {
  const res = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}/messages`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (await handleInvalidToken(res)) return;
  if (!res.ok) throw new Error('Failed to load history');
  return res.json();
}

// Returns an abort function — call it to stop the stream mid-generation
export function sendChatMessage(sessionId, content, { onChunk, onDone, onError }) {
  const controller = new AbortController();

  const run = async () => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name !== 'AbortError') onError('Failed to send message');
      return;
    }

  if (await handleInvalidToken(res)) return;
    if (!res.ok) {
      onError('Failed to send message');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          if (!frame.trim()) continue;
          const lines = frame.split('\n');
          let eventType = 'message';
          let dataLine = '';

          for (const line of lines) {
            if (line.startsWith('event:')) eventType = line.replace('event:', '').trim();
            if (line.startsWith('data:')) dataLine = line.replace('data:', '').trim();
          }

          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine);
            if (eventType === 'chunk') onChunk(parsed.data);
            else if (eventType === 'done') onDone(parsed.messageId);
            else if (eventType === 'error') onError(parsed.message);
          } catch {
            // malformed frame — skip
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') onError('Stream interrupted');
    }
  };

  run();
  return () => controller.abort();
}

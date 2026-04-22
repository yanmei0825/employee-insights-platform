const BASE = '/survey';

export async function createSession(projectId: string) {
  const res = await fetch(`${BASE}/public-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    token: string;
    hasDemographics: boolean;
    availableLanguages: string[];
  }>;
}

export async function getSession(token: string) {
  const res = await fetch(`${BASE}/${token}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    status: string;
    language: string;
    currentDimension: string;
    dimensionLabel: string;
    completedDimensions: string[];
    progress: number;
  }>;
}

export async function setLanguage(token: string, language: string) {
  const res = await fetch(`${BASE}/${token}/language`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitDemographics(token: string, data: Record<string, string>) {
  const res = await fetch(`${BASE}/${token}/demographics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendMessage(token: string, content: string) {
  const res = await fetch(`${BASE}/${token}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    reply: string;
    dimensionChanged: boolean;
    newDimension: string | null;
    interviewComplete: boolean;
    guardTriggered: boolean;
    guardReason?: string;
  }>;
}

export async function sendMessageStream(
  token: string,
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void
) {
  const res = await fetch(`${BASE}/${token}/message/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.chunk) onChunk(parsed.chunk);
      } catch { /* ignore */ }
    }
  }
  onDone();
}

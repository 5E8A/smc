export interface SseHandlers {
  onLog?: (line: string) => void;
  onDone: (status: string) => void;
}

export async function consumeSse(res: Response, { onLog, onDone }: SseHandlers): Promise<void> {
  if (!res.ok || !res.body) throw new Error(`request failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = "message";
      const dataLines: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      const framed = dataLines.join("\n");
      let data = framed;
      try {
        const parsed: unknown = JSON.parse(framed);
        if (typeof parsed === "string") data = parsed;
      } catch {
        // plain text payload, keep as-is
      }
      if (event === "log") onLog?.(data);
      if (event === "done") {
        await reader.cancel().catch(() => {});
        onDone(data);
        return;
      }
    }
  }
  onDone("closed");
}

export async function runSsePost(
  url: string,
  handlers: SseHandlers,
  signal?: AbortSignal,
  body?: unknown
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    signal,
    ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  await consumeSse(res, handlers);
}

/**
 * The original extends its PBR shader with "chunk" files: each `/// #replace <target>` line starts a block whose
 * following non-empty lines (trimmed) replace the first occurrence of `<target>` in the base shader.
 */
export function parseChunks(source: string, marker = "/// #replace") {
  const blocks: { target: string; replace: string }[] = [];
  const lines = source.trim().split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith(marker)) continue;
    const target = line.replace(marker, "");
    const body: string[] = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].trim().startsWith(marker)) {
      const l = lines[j].trim();
      if (l) body.push(l);
      j++;
    }
    blocks.push({ target: target.trim(), replace: body.join("\n").trim() });
    i = j - 1;
  }
  return blocks;
}

export function injectChunks(chunks: string, shader: string) {
  return parseChunks(chunks).reduce((out, { target, replace }) => out.replace(target, () => replace), shader);
}

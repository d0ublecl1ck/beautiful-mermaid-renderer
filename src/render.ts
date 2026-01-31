import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

type Format = "unicode" | "ascii" | "svg";

export type ParsedArgs = {
  format: Format;
  inFile?: string;
  outFile?: string;
  listThemes: boolean;
  help: boolean;
  theme?: string;
  bg?: string;
  fg?: string;
  transparent: boolean;
  paddingX?: number;
  paddingY?: number;
  boxBorderPadding?: number;
};

function usage(): string {
  return [
    "Usage:",
    "  ./scripts/render.sh [--format unicode|ascii|svg] [--in <file>] [--out <file>]",
    "",
    "Examples:",
    "  cat diagram.mmd | ./scripts/render.sh --format unicode",
    "  cat diagram.mmd | ./scripts/render.sh --format ascii",
    "  cat diagram.mmd | ./scripts/render.sh --format svg --out diagram.svg",
    "  ./scripts/render.sh --list-themes",
    "",
    "Options:",
    "  --format <unicode|ascii|svg>    Output format (default: unicode)",
    "  --in <file>                    Read Mermaid source from file (default: stdin)",
    "  --out <file>                   Write output to file (default: stdout)",
    "  --list-themes                  List built-in SVG themes",
    "  --theme <name>                 SVG only: use a built-in theme",
    "  --bg <color>                   SVG only: background color (overrides theme)",
    "  --fg <color>                   SVG only: foreground color (overrides theme)",
    "  --transparent                  SVG only: transparent background",
    "  --paddingX <n>                 Text only: horizontal spacing",
    "  --paddingY <n>                 Text only: vertical spacing",
    "  --boxBorderPadding <n>         Text only: padding inside node boxes",
    "  --help                         Show help",
  ].join("\n");
}

function popValue(argv: string[], i: number, flag: string): string {
  const v = argv[i + 1];
  if (!v || v.startsWith("-")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return v;
}

function parseIntFlag(value: string, flag: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${flag}: ${value}`);
  }
  return n;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    format: "unicode",
    listThemes: false,
    help: false,
    transparent: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      args.help = true;
      continue;
    }
    if (a === "--list-themes") {
      args.listThemes = true;
      continue;
    }
    if (a === "--format") {
      const v = popValue(argv, i, a);
      if (v !== "unicode" && v !== "ascii" && v !== "svg") {
        throw new Error(`Invalid --format: ${v}`);
      }
      args.format = v;
      i++;
      continue;
    }
    if (a === "--in") {
      args.inFile = popValue(argv, i, a);
      i++;
      continue;
    }
    if (a === "--out") {
      args.outFile = popValue(argv, i, a);
      i++;
      continue;
    }
    if (a === "--theme") {
      args.theme = popValue(argv, i, a);
      i++;
      continue;
    }
    if (a === "--bg") {
      args.bg = popValue(argv, i, a);
      i++;
      continue;
    }
    if (a === "--fg") {
      args.fg = popValue(argv, i, a);
      i++;
      continue;
    }
    if (a === "--transparent") {
      args.transparent = true;
      continue;
    }
    if (a === "--paddingX") {
      args.paddingX = parseIntFlag(popValue(argv, i, a), a);
      i++;
      continue;
    }
    if (a === "--paddingY") {
      args.paddingY = parseIntFlag(popValue(argv, i, a), a);
      i++;
      continue;
    }
    if (a === "--boxBorderPadding") {
      args.boxBorderPadding = parseIntFlag(popValue(argv, i, a), a);
      i++;
      continue;
    }
    if (a.startsWith("-")) {
      throw new Error(`Unknown flag: ${a}`);
    }
    // Support a single positional input file for convenience.
    if (!args.inFile) {
      args.inFile = a;
      continue;
    }
    throw new Error(`Unexpected argument: ${a}`);
  }

  return args;
}

function normalizeMermaidSource(source: string): string {
  const trimmed = source.trim();
  const lines = trimmed.split(/\r?\n/);
  if (lines.length === 0) return trimmed;

  // beautiful-mermaid expects the flowchart header to be on its own line:
  //   graph LR
  //   A --> B
  // Normalize Mermaid's common one-line shorthand:
  //   graph LR; A --> B
  const m = lines[0].match(/^(graph|flowchart)\s+(TD|TB|LR|BT|RL)\s*;\s*(.+)$/i);
  if (!m) return trimmed;

  const [, kind, dir, rest] = m;
  const statements = rest
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  lines[0] = `${kind} ${dir}`;
  lines.splice(1, 0, ...statements);
  return lines.join("\n");
}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readInput(args: ParsedArgs): Promise<string> {
  if (args.inFile) {
    return await readFile(args.inFile, "utf8");
  }
  if (process.stdin.isTTY) {
    throw new Error("No input provided. Pass --in <file> or pipe Mermaid source via stdin.");
  }
  return await readStdin();
}

export async function renderFromText(
  mermaid: string,
  args: Pick<
    ParsedArgs,
    | "format"
    | "theme"
    | "bg"
    | "fg"
    | "transparent"
    | "paddingX"
    | "paddingY"
    | "boxBorderPadding"
  >,
): Promise<string> {
  const { renderMermaid, renderMermaidAscii, THEMES } = await import("beautiful-mermaid");
  const normalized = normalizeMermaidSource(mermaid);

  if (args.format === "svg") {
    const themeColors = args.theme ? (THEMES as Record<string, Record<string, string>>)[args.theme] : undefined;
    if (args.theme && !themeColors) {
      throw new Error(`Unknown theme: ${args.theme}. Use --list-themes to see available names.`);
    }

    const options: Record<string, unknown> = {
      ...(themeColors ?? {}),
      ...(args.bg ? { bg: args.bg } : {}),
      ...(args.fg ? { fg: args.fg } : {}),
      ...(args.transparent ? { transparent: true } : {}),
    };
    return await renderMermaid(normalized, options);
  }

  const textOptions: Record<string, unknown> = {
    useAscii: args.format === "ascii",
    ...(args.paddingX !== undefined ? { paddingX: args.paddingX } : {}),
    ...(args.paddingY !== undefined ? { paddingY: args.paddingY } : {}),
    ...(args.boxBorderPadding !== undefined ? { boxBorderPadding: args.boxBorderPadding } : {}),
  };
  return renderMermaidAscii(normalized, textOptions);
}

async function main(): Promise<void> {
  let args: ParsedArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(String(err instanceof Error ? err.message : err));
    console.error("");
    console.error(usage());
    process.exitCode = 2;
    return;
  }

  if (args.help) {
    console.log(usage());
    return;
  }

  if (args.listThemes) {
    const { THEMES } = await import("beautiful-mermaid");
    console.log(Object.keys(THEMES).sort().join("\n"));
    return;
  }

  try {
    const mermaid = (await readInput(args)).trim();
    if (!mermaid) {
      throw new Error("Empty Mermaid source.");
    }

    const out = await renderFromText(mermaid, args);
    if (args.outFile) {
      await writeFile(args.outFile, out, "utf8");
    } else {
      process.stdout.write(out);
      if (!out.endsWith("\n")) process.stdout.write("\n");
    }
  } catch (err) {
    console.error(String(err instanceof Error ? err.message : err));
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  await main();
}

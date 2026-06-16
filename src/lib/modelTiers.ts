// Device tiers for Orchestra-Core's local AI chat.
//
// The app + lesson library is the same for everyone. Only the AI model that
// powers "Ask Orchestra-Core" changes by device — bigger devices get a
// bigger, smarter model; smaller devices get a smaller one (or a
// browser-only fallback with no install at all).
//
// "primary" is the path Orchestra-Core sets up automatically (via Ollama).
// "alternatives" are other ways power users can run a similar model if they
// prefer a different tool, listed for transparency/choice — not required.

export interface RuntimeOption {
  runtime: string;
  model: string;
  install: string;
  license?: string;
}

export interface DeviceTier {
  id: string;
  name: string;
  ramRange: string;
  size: string;
  for: string;
  primary: RuntimeOption;
  alternatives: RuntimeOption[];
}

export const modelTiers: DeviceTier[] = [
  {
    id: 'light',
    name: 'Light',
    ramRange: 'Under 4GB RAM',
    size: '~180 MB app + ~400 MB model',
    for: 'Older phones, budget tablets, and laptops where chat should stay light. Full lesson library either way — chat is short and simple.',
    primary: {
      runtime: 'Ollama',
      model: 'qwen2.5:0.5b',
      install: 'Installed automatically the first time you open Orchestra-Core (requires Ollama, free & open-source).',
      license: 'Apache-2.0',
    },
    alternatives: [
      {
        runtime: 'Browser only (WebLLM)',
        model: 'Qwen2.5-0.5B / SmolLM2 (quantized)',
        install: 'No install at all — runs inside the Orchestra-Core website tab using your browser\'s WebGPU. Slower, and only works while the tab is open.',
      },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    ramRange: '4-8GB RAM',
    size: '~320 MB app + ~2 GB model',
    for: 'Most modern phones, Chromebooks, and everyday laptops. Recommended for most people.',
    primary: {
      runtime: 'Ollama',
      model: 'qwen2.5:3b',
      install: 'Installed automatically the first time you open Orchestra-Core (requires Ollama, free & open-source).',
      license: 'Apache-2.0',
    },
    alternatives: [
      {
        runtime: 'Ollama',
        model: 'qwen3.5:4b',
        install: 'Pull manually with `ollama pull qwen3.5:4b` if you want a newer model and have a little extra RAM to spare.',
      },
      {
        runtime: 'LM Studio',
        model: 'Qwen2.5-3B-Instruct (GGUF)',
        install: 'Separate app (lmstudio.ai) with its own model browser — an alternative to Ollama if you already use it.',
      },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    ramRange: '8-16GB RAM',
    size: '~560 MB app + ~4.7 GB model',
    for: 'Flagship phones and most laptops/desktops bought in the last few years. Full-quality chat with noticeably faster, richer answers.',
    primary: {
      runtime: 'Ollama',
      model: 'qwen2.5:7b',
      install: 'Installed automatically the first time you open Orchestra-Core (requires Ollama, free & open-source).',
      license: 'Apache-2.0',
    },
    alternatives: [
      {
        runtime: 'Ollama (Apple Silicon)',
        model: 'qwen2.5:7b',
        install: 'On M-series Macs, Ollama 0.19+ automatically uses Apple\'s MLX engine for this model — faster, no extra setup.',
      },
      {
        runtime: 'LM Studio',
        model: 'Qwen2.5-7B-Instruct (GGUF)',
        install: 'Separate app (lmstudio.ai) — an alternative to Ollama if you already use it.',
      },
      {
        runtime: 'llama.cpp',
        model: 'Qwen2.5-7B-Instruct (GGUF)',
        install: 'For technical users: download a .gguf file from Hugging Face and run it with the llama.cpp server binary directly.',
      },
    ],
  },
  {
    id: 'max',
    name: 'Max',
    ramRange: '16GB+ RAM (or 8GB+ dedicated GPU)',
    size: '~560 MB app + ~9 GB model',
    for: 'High-end laptops and desktops. The most capable local chat Orchestra-Core offers — best for long, nuanced conversations.',
    primary: {
      runtime: 'Ollama',
      model: 'qwen2.5:14b',
      install: 'Installed automatically the first time you open Orchestra-Core (requires Ollama, free & open-source).',
      license: 'Apache-2.0',
    },
    alternatives: [
      {
        runtime: 'Ollama (Apple Silicon)',
        model: 'qwen2.5:14b',
        install: 'On M-series Macs with 16GB+ unified memory, Ollama 0.19+ runs this via MLX automatically.',
      },
      {
        runtime: 'MLX (Apple Silicon, advanced)',
        model: 'Qwen2.5-14B-Instruct (MLX)',
        install: 'pip install mlx-lm, then run the model directly with Python — for users who want to skip Ollama entirely on a Mac.',
      },
      {
        runtime: 'LM Studio',
        model: 'Qwen2.5-14B-Instruct (GGUF)',
        install: 'Separate app (lmstudio.ai) — an alternative to Ollama if you already use it.',
      },
    ],
  },
];

export const defaultTier = modelTiers[1];

// A note shown on Windows devices with an NPU (Copilot+ PC). Orchestra-Core
// doesn't have a dedicated NPU build yet, but it's worth telling users their
// device has extra headroom Windows itself may use for on-device AI features.
export const npuNote =
  'Your device may also have an NPU (neural processing unit) that Windows itself uses for on-device AI features via ONNX Runtime / DirectML. Orchestra-Core doesn\'t have a dedicated NPU build yet — it runs on the model above either way.';

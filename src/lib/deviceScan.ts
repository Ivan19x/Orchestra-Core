// Device scan for the Download page.
//
// Privacy principle: everything here runs in your browser, using standard
// web APIs, and stays in your browser. Orchestra-Core has no server to send
// it to — the scan only decides which model tier to recommend. Each signal
// below is shown to the user with a plain-language explanation of why it's
// checked, alongside the exact value detected.

import { modelTiers, defaultTier, type DeviceTier } from './modelTiers';

export interface DeviceSignal {
  key: string;
  label: string;
  value: string;
  detected: boolean;
  why: string;
}

export interface DeviceScanResult {
  signals: DeviceSignal[];
  recommendedTier: DeviceTier;
}

function detectMemory(): { value: string; gb: number | null; detected: boolean } {
  const mem = (navigator as any).deviceMemory as number | undefined;
  if (typeof mem === 'number') {
    return { value: `~${mem} GB`, gb: mem, detected: true };
  }
  return { value: 'Not reported by this browser', gb: null, detected: false };
}

function detectCores(): { value: string; cores: number | null } {
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number') {
    return { value: `${cores} logical cores`, cores };
  }
  return { value: 'Not reported by this browser', cores: null };
}

function detectPlatform(): { value: string; isAppleSilicon: boolean } {
  const uaData = (navigator as any).userAgentData;
  const ua = navigator.userAgent;
  let platform = uaData?.platform || navigator.platform || 'Unknown';

  const isMac = /mac/i.test(platform) || /Macintosh/i.test(ua);
  const isAppleSilicon = isMac && (/arm/i.test(uaData?.architecture || '') || /Apple M/i.test(ua) || (isMac && /AppleWebKit/.test(ua) && (navigator as any).maxTouchPoints !== undefined));

  let value = platform;
  if (isMac) value = isAppleSilicon ? 'macOS (Apple Silicon)' : 'macOS (Intel)';
  else if (/win/i.test(platform)) value = 'Windows';
  else if (/android/i.test(ua)) value = 'Android';
  else if (/iphone|ipad/i.test(ua)) value = 'iOS';
  else if (/linux/i.test(platform)) value = 'Linux';

  return { value, isAppleSilicon };
}

async function detectGpu(): Promise<{ value: string; available: boolean }> {
  const gpu = (navigator as any).gpu;
  if (!gpu) return { value: 'WebGPU not available in this browser', available: false };
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return { value: 'No compatible GPU found', available: false };
    return { value: 'Available (browser-accelerated AI is possible)', available: true };
  } catch {
    return { value: 'Could not be checked', available: false };
  }
}

async function detectStorage(): Promise<{ value: string; gb: number | null }> {
  if (!navigator.storage?.estimate) {
    return { value: 'Not reported by this browser', gb: null };
  }
  try {
    const { quota } = await navigator.storage.estimate();
    if (!quota) return { value: 'Not reported by this browser', gb: null };
    const gb = quota / (1024 * 1024 * 1024);
    return { value: `~${gb.toFixed(1)} GB available to this browser`, gb };
  } catch {
    return { value: 'Not reported by this browser', gb: null };
  }
}

function pickTier(memGb: number | null, cores: number | null): DeviceTier {
  // Fall back to CPU core count as a rough proxy when deviceMemory isn't
  // reported (Firefox, Safari) — more cores generally tracks with more RAM.
  const effectiveGb = memGb ?? (cores ? cores * 2 : null);

  if (effectiveGb === null) return defaultTier;
  if (effectiveGb <= 3) return modelTiers.find((t) => t.id === 'light')!;
  if (effectiveGb <= 7) return modelTiers.find((t) => t.id === 'standard')!;
  if (effectiveGb <= 15) return modelTiers.find((t) => t.id === 'pro')!;
  return modelTiers.find((t) => t.id === 'max')!;
}

export async function scanDevice(): Promise<DeviceScanResult> {
  const memory = detectMemory();
  const cores = detectCores();
  const platform = detectPlatform();
  const [gpu, storage] = await Promise.all([detectGpu(), detectStorage()]);

  const signals: DeviceSignal[] = [
    {
      key: 'memory',
      label: 'Approximate device memory (RAM)',
      value: memory.value,
      detected: memory.detected,
      why: 'The single biggest factor in which AI model size your device can run smoothly. Used to pick a model tier.',
    },
    {
      key: 'cores',
      label: 'CPU cores available',
      value: cores.value,
      detected: cores.cores !== null,
      why: 'A secondary signal for how fast a local model will respond. Used as a fallback if RAM can\'t be detected, and to fine-tune the recommendation.',
    },
    {
      key: 'platform',
      label: 'Operating system & chip type',
      value: platform.value,
      detected: true,
      why: 'Used to offer the right installer (Windows / macOS / Linux), and to detect Apple Silicon, which can run AI models faster via Apple\'s MLX engine.',
    },
    {
      key: 'gpu',
      label: 'Browser graphics acceleration (WebGPU)',
      value: gpu.value,
      detected: gpu.available,
      why: 'Checks whether your browser could run a small AI model directly with zero install — used as a fallback option for low-power devices, never as the only option.',
    },
    {
      key: 'storage',
      label: 'Free storage space',
      value: storage.value,
      detected: storage.gb !== null,
      why: 'AI models are large downloads (hundreds of MB to several GB). Used to make sure the recommended model will actually fit before suggesting it.',
    },
  ];

  const recommendedTier = pickTier(memory.gb, cores.cores);

  return { signals, recommendedTier };
}

const loadedVideoUrls = new Set<string>();
const preloadedVideoUrls = new Set<string>();
const videoTimes = new Map<string, number>();

let reelMenuLoadedOnce = false;

export function hasReelMenuLoadedOnce() {
  return reelMenuLoadedOnce;
}

export function markReelMenuLoaded() {
  reelMenuLoadedOnce = true;
}

export function hasVideoLoaded(src?: string) {
  return Boolean(src && loadedVideoUrls.has(src));
}

export function markVideoLoaded(src?: string) {
  if (src) {
    loadedVideoUrls.add(src);
    preloadedVideoUrls.add(src);
  }
}

export function hasVideoPreloaded(src?: string) {
  return Boolean(src && preloadedVideoUrls.has(src));
}

export function markVideoPreloaded(src?: string) {
  if (src) {
    preloadedVideoUrls.add(src);
  }
}

export function getVideoResumeTime(src?: string) {
  return src ? videoTimes.get(src) ?? 0 : 0;
}

export function saveVideoResumeTime(src: string | undefined, currentTime: number) {
  if (!src || !Number.isFinite(currentTime) || currentTime <= 0) {
    return;
  }

  videoTimes.set(src, currentTime);
}

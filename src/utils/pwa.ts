/** True when running as an installed web app rather than a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS predates display-mode and exposes its own flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

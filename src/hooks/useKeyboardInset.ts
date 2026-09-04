import { useEffect } from 'react';

// Below this, a shrunken visual viewport is browser chrome (a collapsing URL bar), not a keyboard.
const KEYBOARD_MIN_HEIGHT = 80;

/**
 * Publish the on-screen keyboard height as the `--keyboard-inset` CSS variable.
 *
 * iOS Safari does not shrink the *layout* viewport when the keyboard opens — only the
 * *visual* viewport. So `position: fixed; bottom: 0` stays pinned to the bottom of the full
 * screen, which is now behind the keyboard, and `vh`/`dvh` still measure the full screen. A
 * bottom sheet therefore ends up underneath the keyboard and has to be scrolled into view.
 *
 * `interactive-widget=resizes-content` in the viewport meta fixes this on Android Chrome, but
 * Safari ignores it, so this measurement is what covers iOS.
 *
 * Measuring the keyboard needs JS — there is no CSS equivalent. Publishing it as a CSS
 * variable keeps *layout* decisions in CSS, so breakpoint gating stays in `lg:` / `max-lg:`
 * classes rather than a JS width check.
 *
 * Call once, high in the tree.
 */
export function useKeyboardInset(): void {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;

    const update = () => {
      // The gap between the bottom of the visible area and the bottom of the layout viewport
      // is what the keyboard covers. offsetTop keeps this right while the visual viewport is
      // scrolled, which iOS does when focusing an input near the bottom of the screen.
      const covered = window.innerHeight - (viewport.height + viewport.offsetTop);
      root.style.setProperty('--keyboard-inset', `${covered > KEYBOARD_MIN_HEIGHT ? Math.round(covered) : 0}px`);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--keyboard-inset');
    };
  }, []);
}

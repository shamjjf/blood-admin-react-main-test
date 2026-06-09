import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to the top on every route change.
 *
 * Without this, React Router keeps the previous page's scroll offset, so
 * opening a new tab/page leaves it scrolled down — the page heading ends up
 * pushed up under the fixed navbar ("goes to the back of the screen").
 *
 * Renders nothing; it only runs the side effect.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // The window is the scroll container (navbar is position:fixed).
    window.scrollTo(0, 0);
    // Belt-and-suspenders: if a layout ever owns the scroll, reset it too.
    document.querySelector(".main-panel")?.scrollTo?.(0, 0);
    document.querySelector(".content-wrapper")?.scrollTo?.(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;

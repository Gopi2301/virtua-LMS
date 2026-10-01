import { useEffect } from "react";
import type { RefObject } from "react";

/** Keyboard focus and scroll containment for the responsive navigation drawers. */
export function useDrawerFocus(
  open: boolean,
  setOpen: (open: boolean) => void,
  ref: RefObject<HTMLElement | null>,
  breakpoint: number,
) {
  useEffect(() => {
    if (!open || window.innerWidth > breakpoint) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    const controls = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]',
        ) || [],
      ).filter((el) => el.getClientRects().length > 0);
    controls()[0]?.focus();
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const elements = controls();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const resize = () => {
      if (window.innerWidth > breakpoint) setOpen(false);
    };
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [open, setOpen, ref, breakpoint]);
}

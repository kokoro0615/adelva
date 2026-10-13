/**
 * Whether a click on an anchor will take the reader to another document or
 * route of this site in the current tab.
 *
 * Modified clicks (new tab, new window, download), other origins, other
 * targets and same-document hash moves all return false: the page the reader
 * is on stays where it is. `defaultPrevented` is deliberately not consulted:
 * `next/link` prevents the default of every client-side navigation it makes.
 */
export function leavesPage(
  event: Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">,
  anchor: HTMLAnchorElement,
): boolean {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }
  if (anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) {
    return false;
  }
  return (
    url.pathname !== window.location.pathname || url.search !== window.location.search
  );
}

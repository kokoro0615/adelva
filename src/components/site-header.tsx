"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import styles from "@/components/site-header.module.css";
import {
  adelvaBrand,
  audiences,
  challenges,
  contactCta,
  groupLabels,
  menuIntros,
  primaryNavigation,
  routeStatusOf,
  serviceDomains,
  type AdelvaMenuId,
  type AdelvaMenuIntro,
} from "@/content/adelva-navigation";
import { lockScroll, prefersMotion } from "@/lib/motion";

const DRAWER_ID = "site-menu";
const panelId = (menu: AdelvaMenuId) => `${DRAWER_ID}-${menu}`;

/** Hover intent: short enough to feel instant, long enough to survive a
 *  diagonal pointer path across the bar. */
const HOVER_OPEN_DELAY = 90;
const HOVER_CLOSE_DELAY = 220;
/** The scroll offset at which the bar tightens and deepens its field. */
const COMPACT_AT = 24;
/** Focus-ring clearance: the global ring is 3px wide at a 3px offset. */
const FOCUS_RING_CLEARANCE = 6;
/** Below this width the bar hands over to the modal drawer. */
const DESKTOP_QUERY = "(min-width: 64rem)";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/** Measurements have to land before paint, but `useLayoutEffect` is a no-op
 *  and a warning during server rendering. */
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Focusable descendants a keyboard can actually reach.
 *
 * A collapsed disclosure panel is `inert`, so the browser already skips it. The
 * trap has to skip it too, otherwise it computes a boundary element that cannot
 * take focus and drops focus out of the dialog entirely.
 */
function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.closest("[inert]") && element.getBoundingClientRect().height > 0,
  );
}

/** Whether the control and its 3px outline plus 3px offset can all be painted. */
function isFullyExposed(element: HTMLElement, clippingAncestor: HTMLElement): boolean {
  const box = element.getBoundingClientRect();
  const clip = clippingAncestor.getBoundingClientRect();
  const style = getComputedStyle(element);
  const ring = {
    left: box.left - FOCUS_RING_CLEARANCE,
    top: box.top - FOCUS_RING_CLEARANCE,
    right: box.right + FOCUS_RING_CLEARANCE,
    bottom: box.bottom + FOCUS_RING_CLEARANCE,
  };
  return (
    style.visibility === "visible" &&
    box.width > 0 &&
    box.height > 0 &&
    ring.left >= 0 &&
    ring.top >= 0 &&
    ring.right <= window.innerWidth &&
    ring.bottom <= window.innerHeight &&
    ring.left >= clip.left &&
    ring.top >= clip.top &&
    ring.right <= clip.right &&
    ring.bottom <= clip.bottom
  );
}

function setBackgroundInert(inert: boolean): void {
  for (const selector of ["#main-content", "[data-site-footer]", "[data-skip-link]"]) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      element.inert = inert;
    }
  }
}

interface NavAnchorProps {
  readonly href: string;
  readonly className: string;
  readonly children: ReactNode;
  readonly current: boolean;
  readonly onNavigate?: () => void;
  readonly ariaLabelledBy?: string;
}

/**
 * One destination.
 *
 * Destinations this repository actually serves are routed through `Link` so
 * they prefetch and transition. The ADELVA destinations do not exist here yet —
 * they are unbuilt in the ADELVA source project too — so they are emitted as
 * plain anchors carrying `data-route-status="pending"`. That keeps the
 * information architecture canonical without asking Next.js to prefetch a route
 * that cannot resolve, and it makes the gap machine-readable rather than
 * hidden. `docs/specs/adelva-navigation-spec.md` §8.1 lists every one.
 */
function NavAnchor({
  href,
  className,
  children,
  current,
  onNavigate,
  ariaLabelledBy,
}: NavAnchorProps) {
  const status = routeStatusOf(href);
  const shared = {
    className,
    onClick: onNavigate,
    "aria-current": current ? ("page" as const) : undefined,
    "aria-labelledby": ariaLabelledBy,
    "data-route-status": status,
  };

  if (status === "available") {
    return (
      <Link href={href} {...shared}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...shared}>
      {children}
    </a>
  );
}

function Arrow() {
  return <span className={styles.arrow} aria-hidden="true" />;
}

/**
 * The identity lockup: the supplied monogram as a `currentColor` mask beside
 * the wordmark. The mark is decorative here because the link already carries
 * the accessible name, so the two are never announced twice.
 */
function BrandLink({
  current,
  onNavigate,
}: {
  current: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      className={styles.brand}
      href={adelvaBrand.homeHref}
      aria-label={adelvaBrand.name}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
    >
      <span className={styles.brandMark} aria-hidden="true" />
      <span className={styles.brandWord} aria-hidden="true">
        {adelvaBrand.name}
      </span>
    </Link>
  );
}

/**
 * ADELVA global navigation.
 *
 * Two separately composed surfaces share one data source:
 *
 *  - **≥64rem** a full-bleed mega shelf under a glass bar. It is a non-modal
 *    disclosure: it never locks the document, it dismisses on scroll so it can
 *    never float over content the reader has moved past, and focus stays in the
 *    natural tab order rather than being trapped.
 *  - **<64rem** a modal drawer with a focus trap, a real scroll lock, staged
 *    disclosures, and a full-width call to action.
 *
 * Both close on Escape and return focus to the control that opened them.
 * Both degrade to an instant state change under `prefers-reduced-motion`.
 */
export function SiteHeader() {
  const pathname = usePathname();

  const [compact, setCompact] = useState(false);
  const [openMenu, setOpenMenu] = useState<AdelvaMenuId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [shelfHeight, setShelfHeight] = useState<number | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [rule, setRule] = useState<{ x: number; width: number } | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const panelRefs = useRef(new Map<AdelvaMenuId, HTMLDivElement>());
  const triggerRefs = useRef(new Map<AdelvaMenuId, HTMLButtonElement>());

  const openMenuRef = useRef<AdelvaMenuId | null>(null);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  /** A trigger a click just closed. Suppresses the hover-reopen the resting
   *  pointer would otherwise fire from that same control. */
  const suppressHover = useRef<AdelvaMenuId | null>(null);

  useEffect(() => {
    openMenuRef.current = openMenu;
  }, [openMenu]);

  const clearTimers = useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
    }
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const closeMenu = useCallback(
    (restoreFocus = false) => {
      clearTimers();
      const current = openMenuRef.current;
      if (restoreFocus && current) {
        triggerRefs.current.get(current)?.focus();
      }
      setOpenMenu(null);
      setHoveredLabel(null);
    },
    [clearTimers],
  );

  const closeDrawer = useCallback((restoreFocus: boolean) => {
    if (restoreFocus) {
      const opener = burgerRef.current;
      if (opener?.isConnected) {
        opener.focus();
      }
    }
    setDrawerOpen(false);
  }, []);

  const closeAll = useCallback(() => {
    closeMenu(false);
    setDrawerOpen(false);
  }, [closeMenu]);

  /*
   * Compact field. A boolean flip per threshold crossing, never a per-frame
   * style write, so scrolling stays off the layout path. Any scroll also
   * dismisses an open mega panel: a surface anchored to a fixed bar must never
   * float over content the reader has already moved past.
   */
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        setCompact(window.scrollY > COMPACT_AT);
        if (openMenuRef.current !== null) {
          closeMenu(false);
        }
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [closeMenu]);

  /* Whichever surface stops applying at the current width closes itself. */
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);

    const sync = () => {
      if (query.matches) {
        setDrawerOpen(false);
      } else {
        closeMenu(false);
      }
    };

    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [closeMenu]);

  /* Escape closes whichever surface is open and returns focus to its opener. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (drawerOpen) {
        event.preventDefault();
        closeDrawer(true);
        return;
      }
      if (openMenuRef.current !== null) {
        event.preventDefault();
        closeMenu(true);
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [closeDrawer, closeMenu, drawerOpen]);

  /* Touch and pen have no hover, so an outside press has to dismiss. */
  useEffect(() => {
    if (openMenu === null) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && headerRef.current?.contains(target)) {
        return;
      }
      closeMenu(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [closeMenu, openMenu]);

  /* Modal drawer: the document holds its exact reading position and the page
   * behind it leaves the tab order and the accessibility tree entirely. */
  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const release = lockScroll();
    setBackgroundInert(true);

    return () => {
      release();
      setBackgroundInert(false);
    };
  }, [drawerOpen]);

  /* Tab cycles inside the drawer instead of escaping into the page behind it. */
  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }
      const drawer = drawerRef.current;
      if (!drawer) {
        return;
      }

      const items = focusableWithin(drawer);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && drawer.contains(active);

      // An early Tab during the wipe must not land on a control the author is
      // still translating outside the viewport.
      if (!inside && closeRef.current && !isFullyExposed(closeRef.current, drawer)) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [drawerOpen]);

  /*
   * Focus enters the drawer when it opens.
   *
   * `focus()` is a silent no-op on an element the browser still considers
   * hidden, and a control that has been painted outside the viewport is worse
   * than one that has not been painted at all: the reader gets a focus ring
   * they cannot see. The move is therefore conditioned on the Close control
   * plus its focus ring fitting inside both the viewport and the moving
   * panel's clipping rectangle, sampled per animation frame, rather than on a
   * transition event or a duration. It yields the moment focus is anywhere
   * inside the drawer, so it can never pull back a reader who has tabbed on.
   */
  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    let frame = 0;

    const enterDialog = () => {
      frame = 0;
      const drawer = drawerRef.current;
      if (!drawer || drawer.contains(document.activeElement)) {
        return;
      }

      const preferred = closeRef.current;
      if (preferred && preferred.getBoundingClientRect().height > 0) {
        if (isFullyExposed(preferred, drawer)) {
          preferred.focus();
          return;
        }
        frame = window.requestAnimationFrame(enterDialog);
        return;
      }

      const firstExposed = focusableWithin(drawer).find((element) =>
        isFullyExposed(element, drawer),
      );
      if (firstExposed) {
        firstExposed.focus();
        return;
      }

      frame = window.requestAnimationFrame(enterDialog);
    };

    if (prefersMotion()) {
      // The open attribute and its transition are committed together. Wait one
      // paint so geometry reflects the running wipe rather than the final style
      // that exists before the browser establishes the transition.
      frame = window.requestAnimationFrame(enterDialog);
    } else {
      enterDialog();
    }

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [drawerOpen]);

  /* One surface, many contents: the shelf takes the height of whichever panel
   * is active, so switching menus reads as a single object resizing. */
  useMeasureEffect(() => {
    if (openMenu === null) {
      return;
    }
    const panel = panelRefs.current.get(openMenu);
    if (!panel || typeof ResizeObserver === "undefined") {
      return;
    }

    const sync = () => setShelfHeight(panel.getBoundingClientRect().height);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [openMenu]);

  /* The travelling rule follows the pointer and parks under the open trigger. */
  const openLabel =
    primaryNavigation.find((item) => item.kind === "menu" && item.menu === openMenu)
      ?.label ?? null;
  const ruleLabel = hoveredLabel ?? openLabel;

  useMeasureEffect(() => {
    // With no target the rule fades out in place rather than snapping home.
    if (!ruleLabel) {
      return;
    }
    const item = itemRefs.current.get(ruleLabel);
    const nav = navRef.current;
    if (!item || !nav || typeof ResizeObserver === "undefined") {
      return;
    }

    const sync = () => {
      const itemBox = item.getBoundingClientRect();
      const navBox = nav.getBoundingClientRect();
      setRule({ x: itemBox.left - navBox.left, width: itemBox.width });
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [ruleLabel]);

  const scheduleOpen = useCallback(
    (menu: AdelvaMenuId) => {
      clearTimers();
      // Switching between already-open menus must not re-pay the intent delay.
      if (openMenuRef.current !== null) {
        setOpenMenu(menu);
        return;
      }
      openTimer.current = window.setTimeout(() => setOpenMenu(menu), HOVER_OPEN_DELAY);
    },
    [clearTimers],
  );

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), HOVER_CLOSE_DELAY);
  }, [clearTimers]);

  const handleItemPointerEnter = (
    event: ReactPointerEvent<HTMLElement>,
    label: string,
    menu: AdelvaMenuId | null,
  ) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    setHoveredLabel(label);
    if (menu === null) {
      scheduleClose();
      return;
    }
    if (suppressHover.current === menu) {
      return;
    }
    scheduleOpen(menu);
  };

  const handleTriggerClick = (menu: AdelvaMenuId) => {
    clearTimers();
    if (openMenuRef.current === menu) {
      suppressHover.current = menu;
      setOpenMenu(null);
      return;
    }
    suppressHover.current = null;
    setOpenMenu(menu);
  };

  const handleHeaderPointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    suppressHover.current = null;
    setHoveredLabel(null);
    if (event.pointerType !== "mouse") {
      return;
    }
    scheduleClose();
  };

  const handleHeaderBlur = (event: ReactFocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    closeMenu(false);
  };

  const toggleSection = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isCurrent = (href: string) => pathname === href.split("#")[0];
  const homeIsCurrent = pathname === adelvaBrand.homeHref;
  const indexLinkProps = { isCurrent, onNavigate: closeAll };

  return (
    <>
      <header
        ref={headerRef}
        className={styles.header}
        lang="ja"
        data-fidelity-landmark="header-nav"
        data-surface={pathname === "/contact" ? "light" : undefined}
        data-compact={compact}
        data-menu-open={openMenu !== null}
        style={
          shelfHeight === null
            ? undefined
            : ({ "--shelf-h": `${shelfHeight}px` } as CSSProperties)
        }
        onPointerLeave={handleHeaderPointerLeave}
        onBlur={handleHeaderBlur}
      >
        {/* Two decorative layers, in paint order. The veil is a feathered
            darkening of the photograph that protects the resting labels; the
            pane is the single sheet of glass the expanded navigation is made
            of, spanning the bar and the shelf so they cannot seam. */}
        <div className={styles.veil} aria-hidden="true" />
        <div className={styles.pane} aria-hidden="true" />

        <div className={styles.bar}>
          <BrandLink current={homeIsCurrent} />

          <nav
            ref={navRef}
            className={styles.primary}
            aria-label="グローバルナビゲーション"
          >
            {primaryNavigation.map((item) =>
              item.kind === "menu" ? (
                <button
                  key={item.label}
                  ref={(node) => {
                    if (node) {
                      itemRefs.current.set(item.label, node);
                      triggerRefs.current.set(item.menu, node);
                    } else {
                      itemRefs.current.delete(item.label);
                      triggerRefs.current.delete(item.menu);
                    }
                  }}
                  type="button"
                  className={styles.item}
                  aria-expanded={openMenu === item.menu}
                  aria-controls={panelId(item.menu)}
                  onPointerEnter={(event) =>
                    handleItemPointerEnter(event, item.label, item.menu)
                  }
                  onPointerLeave={() => {
                    if (suppressHover.current === item.menu) {
                      suppressHover.current = null;
                    }
                  }}
                  onClick={() => handleTriggerClick(item.menu)}
                >
                  <span>{item.label}</span>
                  <span className={styles.chevron} aria-hidden="true" />
                </button>
              ) : (
                <a
                  key={item.label}
                  ref={(node) => {
                    if (node) {
                      itemRefs.current.set(item.label, node);
                    } else {
                      itemRefs.current.delete(item.label);
                    }
                  }}
                  className={styles.item}
                  href={item.href}
                  data-route-status={routeStatusOf(item.href)}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  onPointerEnter={(event) =>
                    handleItemPointerEnter(event, item.label, null)
                  }
                >
                  <span>{item.label}</span>
                </a>
              ),
            )}

            <span
              className={styles.rule}
              aria-hidden="true"
              data-visible={ruleLabel !== null && rule !== null}
              style={
                rule
                  ? {
                      transform: `translate3d(${rule.x}px, 0, 0) scaleX(${
                        rule.width / 100
                      })`,
                    }
                  : undefined
              }
            />
          </nav>

          <a
            className={styles.cta}
            href={contactCta.href}
            data-route-status={routeStatusOf(contactCta.href)}
            aria-current={isCurrent(contactCta.href) ? "page" : undefined}
          >
            {contactCta.label}
            <Arrow />
          </a>
          <a
            className={styles.ctaCompact}
            href={contactCta.href}
            data-route-status={routeStatusOf(contactCta.href)}
            aria-current={isCurrent(contactCta.href) ? "page" : undefined}
          >
            {contactCta.compactLabel}
          </a>

          <button
            ref={burgerRef}
            type="button"
            className={styles.burger}
            aria-label={drawerOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={drawerOpen}
            aria-controls={DRAWER_ID}
            onClick={() => (drawerOpen ? closeDrawer(true) : setDrawerOpen(true))}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div
          className={styles.shelf}
          data-site-nav-shelf=""
          data-open={openMenu !== null}
        >
          <MegaPanel
            menu="challenges"
            open={openMenu === "challenges"}
            registerPanel={panelRefs}
            onNavigate={closeAll}
            isCurrent={isCurrent}
          >
            <div className={`${styles.body} ${styles.bodySplit}`}>
              <Group id="nav-group-audiences" label={groupLabels.audiences}>
                <ul className={styles.cards} aria-labelledby="nav-group-audiences">
                  {audiences.map((audience) => (
                    <li key={audience.href}>
                      <NavAnchor
                        className={styles.card}
                        href={audience.href}
                        current={isCurrent(audience.href)}
                        onNavigate={closeAll}
                      >
                        <span className={styles.cardTitle}>{audience.label}</span>
                        <span className={styles.detail}>{audience.description}</span>
                        <span className={styles.cardArrow}>
                          <Arrow />
                        </span>
                      </NavAnchor>
                    </li>
                  ))}
                </ul>
              </Group>

              <Group id="nav-group-challenges" label={groupLabels.challenges}>
                <ul className={styles.rows} aria-labelledby="nav-group-challenges">
                  {challenges.map((challenge) => (
                    <li key={challenge.href}>
                      <NavAnchor
                        className={styles.row}
                        href={challenge.href}
                        current={isCurrent(challenge.href)}
                        onNavigate={closeAll}
                      >
                        <span className={styles.rowLabel}>{challenge.label}</span>
                        <Arrow />
                        <span className={styles.detail}>{challenge.description}</span>
                      </NavAnchor>
                    </li>
                  ))}
                </ul>
              </Group>
            </div>
          </MegaPanel>

          <MegaPanel
            menu="services"
            open={openMenu === "services"}
            registerPanel={panelRefs}
            onNavigate={closeAll}
            isCurrent={isCurrent}
          >
            <div className={styles.body}>
              <Group id="nav-group-domains" label={groupLabels.domains}>
                <ul className={styles.domains} aria-labelledby="nav-group-domains">
                  {serviceDomains.map((domain) => (
                    <li className={styles.domain} key={domain.id}>
                      <NavAnchor
                        className={styles.domainHead}
                        href={domain.href}
                        current={isCurrent(domain.href)}
                        onNavigate={closeAll}
                      >
                        <span className={styles.domainNumber}>
                          {domain.number}
                          <span className={styles.count}>{domain.count} services</span>
                        </span>
                        <span className={styles.cardTitle}>{domain.label}</span>
                        <span className={styles.detail}>{domain.description}</span>
                      </NavAnchor>
                      <ul className={styles.themes}>
                        {domain.themes.map((theme) => (
                          <li key={theme.href}>
                            <NavAnchor
                              className={styles.theme}
                              href={theme.href}
                              current={isCurrent(theme.href)}
                              onNavigate={closeAll}
                            >
                              {theme.title}
                            </NavAnchor>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </Group>
            </div>
          </MegaPanel>
        </div>
      </header>

      <div
        className={styles.scrim}
        data-site-nav-scrim=""
        data-open={drawerOpen}
        aria-hidden="true"
        onClick={() => closeDrawer(false)}
      />

      <div
        id={DRAWER_ID}
        ref={drawerRef}
        className={styles.drawer}
        data-site-nav-drawer=""
        data-open={drawerOpen}
        role="dialog"
        aria-modal="true"
        aria-label="サイトメニュー"
        lang="ja"
        inert={!drawerOpen}
      >
        <div className={styles.drawerTop}>
          <BrandLink current={homeIsCurrent} onNavigate={closeAll} />
          <button
            ref={closeRef}
            type="button"
            className={styles.drawerClose}
            onClick={() => closeDrawer(true)}
          >
            <span>閉じる</span>
            <span className={styles.closeGlyph} aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="モバイルナビゲーション">
          <Disclosure
            id="drawer-challenges"
            label={menuIntros.challenges.title}
            expanded={expanded.has("challenges")}
            onToggle={() => toggleSection("challenges")}
          >
            <IndexLink intro={menuIntros.challenges} {...indexLinkProps} />
            <p className={styles.drawerGroupLabel}>{groupLabels.audiences}</p>
            {audiences.map((audience) => (
              <DrawerLink
                key={audience.href}
                href={audience.href}
                label={audience.label}
                current={isCurrent(audience.href)}
                onNavigate={closeAll}
              />
            ))}
            <p className={styles.drawerGroupLabel}>{groupLabels.challenges}</p>
            {challenges.map((challenge) => (
              <DrawerLink
                key={challenge.href}
                href={challenge.href}
                label={challenge.label}
                current={isCurrent(challenge.href)}
                onNavigate={closeAll}
              />
            ))}
          </Disclosure>

          <Disclosure
            id="drawer-services"
            label={menuIntros.services.title}
            expanded={expanded.has("services")}
            onToggle={() => toggleSection("services")}
          >
            <IndexLink intro={menuIntros.services} {...indexLinkProps} />
            <div className={styles.nested}>
              {serviceDomains.map((domain) => (
                <Disclosure
                  key={domain.id}
                  id={`drawer-domain-${domain.id}`}
                  label={domain.label}
                  href={domain.href}
                  current={isCurrent(domain.href)}
                  expanded={expanded.has(domain.id)}
                  onToggle={() => toggleSection(domain.id)}
                  onNavigate={closeAll}
                >
                  {domain.themes.map((theme) => (
                    <DrawerLink
                      key={theme.href}
                      href={theme.href}
                      label={theme.title}
                      current={isCurrent(theme.href)}
                      onNavigate={closeAll}
                    />
                  ))}
                </Disclosure>
              ))}
            </div>
          </Disclosure>

          {primaryNavigation
            .flatMap((item) => (item.kind === "link" ? [item] : []))
            .map((item) => (
              <NavAnchor
                key={item.href}
                className={styles.drawerDirect}
                href={item.href}
                current={isCurrent(item.href)}
                onNavigate={closeAll}
              >
                {item.label}
                <Arrow />
              </NavAnchor>
            ))}
        </nav>

        <div className={styles.drawerFoot}>
          <a
            className={styles.drawerCta}
            href={contactCta.href}
            data-route-status={routeStatusOf(contactCta.href)}
            aria-current={isCurrent(contactCta.href) ? "page" : undefined}
            onClick={closeAll}
          >
            {contactCta.label}
            <Arrow />
          </a>
        </div>
      </div>
    </>
  );
}

/**
 * A named group inside a mega panel.
 *
 * The visible label carries the id its list points at with `aria-labelledby`,
 * so the group is announced by its own text and no heading has to be invented
 * to name it.
 */
function Group({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.group}>
      <p className={styles.groupLabel} id={id}>
        {label}
      </p>
      {children}
    </div>
  );
}

function MegaPanel({
  menu,
  open,
  registerPanel,
  onNavigate,
  isCurrent,
  children,
}: {
  menu: AdelvaMenuId;
  open: boolean;
  registerPanel: { current: Map<AdelvaMenuId, HTMLDivElement> };
  onNavigate: () => void;
  isCurrent: (href: string) => boolean;
  children: ReactNode;
}) {
  const intro = menuIntros[menu];

  return (
    <nav
      id={panelId(menu)}
      className={styles.panel}
      data-site-nav-panel={menu}
      data-open={open}
      aria-label={`${intro.title}メニュー`}
      inert={!open}
    >
      <div
        className={styles.panelInner}
        ref={(node) => {
          if (node) {
            registerPanel.current.set(menu, node);
          } else {
            registerPanel.current.delete(menu);
          }
        }}
      >
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <b>{intro.index}</b>
            {intro.roman}
          </p>
          <p className={styles.introTitle}>{intro.title}</p>
          {intro.indexLink ? (
            <NavAnchor
              className={styles.indexLink}
              href={intro.indexLink.href}
              current={isCurrent(intro.indexLink.href)}
              onNavigate={onNavigate}
            >
              {intro.indexLink.label}
              <Arrow />
            </NavAnchor>
          ) : null}
        </div>
        {children}
      </div>
    </nav>
  );
}

/** The drawer row for a panel's own landing page, where it has one. */
function IndexLink({
  intro,
  isCurrent,
  onNavigate,
}: {
  intro: AdelvaMenuIntro;
  isCurrent: (href: string) => boolean;
  onNavigate: () => void;
}) {
  if (!intro.indexLink) {
    return null;
  }
  return (
    <DrawerLink
      href={intro.indexLink.href}
      label={intro.indexLink.label}
      current={isCurrent(intro.indexLink.href)}
      onNavigate={onNavigate}
    />
  );
}

function DrawerLink({
  href,
  label,
  current,
  onNavigate,
}: {
  href: string;
  label: string;
  current: boolean;
  onNavigate: () => void;
}) {
  return (
    <NavAnchor
      className={styles.drawerLink}
      href={href}
      current={current}
      onNavigate={onNavigate}
    >
      {label}
      <Arrow />
    </NavAnchor>
  );
}

/**
 * A staged disclosure.
 *
 * When the row also owns a destination the heading is a link and the adjacent
 * button is toggle-only, so the two roles are never confused — the requirement
 * recorded in `information-architecture.md` §7. Collapsed panels are `inert`,
 * which keeps their links out of the tab order and out of the accessibility
 * tree without hiding them from the transition.
 */
function Disclosure({
  id,
  label,
  href,
  current = false,
  expanded,
  onToggle,
  onNavigate,
  children,
}: {
  id: string;
  label: string;
  href?: string;
  current?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.disclosure}>
      {href ? (
        <div className={styles.disclosureHead}>
          <NavAnchor
            className={styles.disclosureLink}
            href={href}
            current={current}
            onNavigate={onNavigate}
          >
            {label}
          </NavAnchor>
          <button
            type="button"
            className={styles.disclosureToggle}
            aria-label={`${label}を${expanded ? "閉じる" : "開く"}`}
            aria-expanded={expanded}
            aria-controls={id}
            onClick={onToggle}
          >
            <span className={styles.plus} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.disclosureButton}
          aria-expanded={expanded}
          aria-controls={id}
          onClick={onToggle}
        >
          <span>{label}</span>
          <span className={styles.plus} aria-hidden="true" />
        </button>
      )}

      <div
        id={id}
        className={styles.disclosurePanel}
        data-expanded={expanded}
        inert={!expanded}
      >
        <div className={styles.disclosureInner}>{children}</div>
      </div>
    </div>
  );
}

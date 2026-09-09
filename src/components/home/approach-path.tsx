"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type CSSProperties } from "react";
import { adelvaApproach, approachScenes } from "@/content/adelva-approach";
import styles from "./approach-path.module.css";

export function ApproachPath() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      const scene = root?.querySelector<HTMLElement>("[data-approach-scene]");
      if (!root || !scene) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      for (const variant of ["desktop", "mobile"] as const) {
        const query =
          variant === "desktop" ? "(min-width: 600px)" : "(max-width: 599.99px)";
        media.add(`${query} and (prefers-reduced-motion: no-preference)`, () => {
          const svg = root.querySelector<SVGSVGElement>(`[data-route="${variant}"]`);
          const path = svg?.querySelector<SVGPathElement>("[data-path-flown]");
          const cursor = svg?.querySelector<SVGGElement>("[data-path-cursor]");
          if (!svg || !path || !cursor) return;
          const trails = [...svg.querySelectorAll<SVGPathElement>("[data-path-trail]")];
          const geometry = approachScenes[variant];
          const length = path.getTotalLength();
          const samples = Array.from({ length: 257 }, (_, i) => {
            const point = path.getPointAtLength((length * i) / 256);
            return { x: point.x, y: point.y, p: i / 256 };
          });
          const labels = [
            ...root.querySelectorAll<HTMLElement>("[data-approach-step]"),
          ];
          const nodes = [...svg.querySelectorAll<SVGCircleElement>("[data-path-node]")];
          let lastStep = -2;
          let active = true;
          path.style.strokeDasharray = `${length} ${length}`;
          root.dataset.motion = "active";
          const resize = () => {
            const scale = scene.clientWidth / geometry.width;
            // Dash lengths live in the image's coordinate plane. Scale the
            // stroke widths explicitly: non-scaling-stroke would also change
            // dash spacing and separate the luminous tail from its cursor.
            path.style.strokeWidth = String(2.2 / scale);
            trails.forEach((trail, index) => {
              trail.style.strokeWidth = String((3 + index * 0.5) / scale);
            });
            svg.querySelectorAll("circle").forEach((circle) => {
              circle.setAttribute(
                "r",
                String(Number(circle.dataset.radius ?? 4.5) / scale),
              );
            });
          };
          const update = () => {
            const rect = scene.getBoundingClientRect();
            const y =
              ((window.innerHeight * 0.58 - rect.top) / rect.height) * geometry.height;
            let low = 0;
            let high = samples.length - 1;
            while (high - low > 1) {
              const mid = (low + high) >> 1;
              if (samples[mid].y < y) low = mid;
              else high = mid;
            }
            const a = samples[low];
            const b = samples[high];
            const fraction = gsap.utils.clamp(0, 1, (y - a.y) / (b.y - a.y));
            const progress = a.p + (b.p - a.p) * fraction;
            path.style.strokeDashoffset = String(length * (1 - progress));
            const scale = scene.clientWidth / geometry.width;
            trails.forEach((trail) => {
              const tail = Math.min(
                progress,
                Number(trail.dataset.pathTrail) / scale / length,
              );
              trail.style.strokeDasharray = `0 ${progress - tail} ${tail} 1`;
              trail.style.opacity = progress > 0 && progress < 1 ? "1" : "0";
            });
            cursor.setAttribute(
              "transform",
              `translate(${a.x + (b.x - a.x) * fraction} ${a.y + (b.y - a.y) * fraction})`,
            );
            cursor.style.opacity = progress > 0 && progress < 1 ? "1" : "0";
            root.dataset.progress = progress.toFixed(5);
            const step = geometry.nodes.reduce<number>(
              (current, node, index) => (y >= node[1] ? index : current),
              -1,
            );
            if (step !== lastStep) {
              labels.forEach((label, index) => {
                label.dataset.reached = String(index <= step);
                label.dataset.current = String(index === step);
              });
              nodes.forEach((node, index) => {
                node.dataset.reached = String(index <= step);
              });
              lastStep = step;
            }
          };
          resize();
          const trigger = ScrollTrigger.create({
            id: "adelva-approach",
            trigger: scene,
            start: "top bottom",
            end: "bottom top",
            onUpdate: update,
            onRefresh: () => {
              resize();
              update();
            },
          });
          update();
          void document.fonts.ready.then(() => {
            if (active) trigger.refresh();
          });
          return () => {
            active = false;
            trigger.kill();
            path.style.removeProperty("stroke-dasharray");
            path.style.removeProperty("stroke-dashoffset");
            path.style.removeProperty("stroke-width");
            cursor.removeAttribute("transform");
            cursor.style.removeProperty("opacity");
            trails.forEach((trail) => {
              trail.style.removeProperty("stroke-dasharray");
              trail.style.removeProperty("opacity");
              trail.style.removeProperty("stroke-width");
            });
            labels.forEach((label) => {
              delete label.dataset.reached;
              delete label.dataset.current;
            });
            nodes.forEach((node) => {
              delete node.dataset.reached;
            });
            delete root.dataset.motion;
            delete root.dataset.progress;
          };
        });
      }
      media.add("(prefers-reduced-motion: no-preference)", () => {
        // The original path driver begins well below the heading. Give the
        // opening and closing copy their own reading-position choreography.
        for (const group of root.querySelectorAll<HTMLElement>(
          "[data-approach-reveal]",
        )) {
          gsap.fromTo(
            group.children,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.08,
              ease: "none",
              scrollTrigger: {
                trigger: group,
                start: "top 88%",
                end: "top 45%",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }
      });
      let anchorFrame = 0;
      let anchorCancelled = false;
      const cancelAnchor = () => {
        anchorCancelled = true;
      };
      if (window.location.hash === "#approach") {
        // The preceding horizontal sequence establishes its height on mount.
        // Resolve a direct link after fonts/layout, without overriding input.
        window.addEventListener("wheel", cancelAnchor, { passive: true, once: true });
        window.addEventListener("touchstart", cancelAnchor, {
          passive: true,
          once: true,
        });
        window.addEventListener("keydown", cancelAnchor, { once: true });
        void document.fonts.ready.then(() => {
          if (anchorCancelled) return;
          anchorFrame = requestAnimationFrame(() => {
            ScrollTrigger.refresh();
            anchorFrame = requestAnimationFrame(() => {
              if (!anchorCancelled && window.location.hash === "#approach") {
                window.scrollTo({
                  top:
                    root.getBoundingClientRect().top +
                    window.scrollY -
                    Number.parseFloat(getComputedStyle(root).scrollMarginTop),
                  behavior: "instant",
                });
              }
            });
          });
        });
      }
      root.dataset.approachReady = "true";
      return () => {
        anchorCancelled = true;
        cancelAnimationFrame(anchorFrame);
        window.removeEventListener("wheel", cancelAnchor);
        window.removeEventListener("touchstart", cancelAnchor);
        window.removeEventListener("keydown", cancelAnchor);
        media.revert();
        delete root.dataset.approachReady;
      };
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      id="approach"
      className={styles.section}
      aria-labelledby="approach-heading"
      data-fidelity-section="travel-globe"
      data-approach
    >
      <div className={styles.scene} data-approach-scene>
        <picture className={styles.picture}>
          <source
            media="(min-width: 600px)"
            srcSet={approachScenes.desktop.src}
            width={1086}
            height={1448}
          />
          {/* Art-directed, pre-optimized WebP: preserve the native image/path plane. */}
          <img
            src={approachScenes.mobile.src}
            width={724}
            height={2172}
            alt=""
            loading="lazy"
            decoding="async"
            className={styles.image}
            data-approach-photo
          />
        </picture>
        <div className={styles.shade} aria-hidden="true" />
        <header className={styles.heading} data-approach-reveal>
          <h2 id="approach-heading">{adelvaApproach.title}</h2>
          <p lang="ja">{adelvaApproach.titleJa}</p>
        </header>
        {Object.entries(approachScenes).map(([variant, geometry]) => (
          <svg
            key={variant}
            className={`${styles.route} ${variant === "mobile" ? styles.mobileRoute : styles.desktopRoute}`}
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            fill="none"
            aria-hidden="true"
            data-route={variant}
          >
            <defs>
              <radialGradient id={`approach-light-${variant}`}>
                <stop offset="0" stopColor="#fff9dd" stopOpacity="0.95" />
                <stop offset="0.24" stopColor="#ffdc91" stopOpacity="0.72" />
                <stop offset="0.56" stopColor="#ffd080" stopOpacity="0.24" />
                <stop offset="1" stopColor="#ffd080" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d={geometry.path} className={styles.base} />
            <path d={geometry.path} className={styles.flown} data-path-flown />
            <path
              d={geometry.path}
              pathLength="1"
              className={`${styles.trail} ${styles.trailOuter}`}
              data-path-trail="150"
            />
            <path
              d={geometry.path}
              pathLength="1"
              className={`${styles.trail} ${styles.trailMiddle}`}
              data-path-trail="90"
            />
            <path
              d={geometry.path}
              pathLength="1"
              className={`${styles.trail} ${styles.trailInner}`}
              data-path-trail="35"
            />
            {geometry.nodes.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={variant === "mobile" ? 8 : 4}
                className={styles.node}
                data-path-node
              />
            ))}
            <g className={styles.cursor} data-path-cursor>
              <circle
                r="26"
                data-radius="26"
                fill={`url(#approach-light-${variant})`}
              />
              <circle r="12" data-radius="12" className={styles.cursorRing} />
              <circle r="6.5" data-radius="6.5" className={styles.cursorDot} />
            </g>
          </svg>
        ))}
        <ol className={styles.steps} lang="ja" aria-label="支援の6つの工程">
          {adelvaApproach.steps.map((step, index) => (
            <li
              key={step}
              data-approach-step
              style={
                {
                  "--desktop-x": `${(approachScenes.desktop.nodes[index][0] / 1086) * 100}%`,
                  "--desktop-y": `${(approachScenes.desktop.nodes[index][1] / 1448) * 100}%`,
                  "--mobile-x": `${(approachScenes.mobile.nodes[index][0] / 724) * 100}%`,
                  "--mobile-y": `${(approachScenes.mobile.nodes[index][1] / 2172) * 100}%`,
                } as CSSProperties
              }
            >
              <span className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div
        className={styles.summary}
        lang="ja"
        data-approach-reveal
        data-approach-summary
      >
        <p className={styles.lead}>{adelvaApproach.lead}</p>
        <p className={styles.body}>{adelvaApproach.body}</p>
      </div>
    </section>
  );
}

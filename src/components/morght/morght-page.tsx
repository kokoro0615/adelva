"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import vectors from "@/content/morght/vectors.json";
import { SiteHeader } from "@/components/site-header";
import { AdelvaCircleRing, AdelvaWordmark } from "./adelva-identity";
import { FounderSignature } from "@/components/home/founder-signature";
import "./morght.css";

const subscribeMotion = (callback: () => void) => {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const readReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverReducedMotion = () => false;
const photos = [
  { ids: [1, 2], width: 24, mobile: 32.2, rotations: [-2, 1] },
  { ids: [3], width: 37.6, mobile: 51.2, rotations: [-3] },
  { ids: [4, 5], width: 24, mobile: 32.2, rotations: [2, -1] },
  { ids: [6], width: 36.8, mobile: 50, rotations: [2] },
  { ids: [7, 8], width: 24, mobile: 32.2, rotations: [-2, 1] },
  { ids: [9], width: 37.6, mobile: 51.2, rotations: [-2] },
  { ids: [10, 11], width: 24, mobile: 32.2, rotations: [-2, 1] },
  { ids: [12], width: 27.7, mobile: 37.8, rotations: [1] },
  { ids: [13, 14], width: 24, mobile: 32.2, rotations: [-2, 1] },
  { ids: [15], width: 37.6, mobile: 51.2, rotations: [-1] },
  { ids: [16], width: 36.8, mobile: 50, rotations: [1] },
];
function Vector({
  name,
  className = "",
}: {
  name: keyof typeof vectors;
  className?: string;
}) {
  // Only reviewed, local, static vector paths; no external HTML or script input.
  return (
    <span
      aria-hidden="true"
      className={`mg-vector ${className}`}
      dangerouslySetInnerHTML={{ __html: vectors[name] }}
    />
  );
}

export function MorghtPage() {
  const root = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const paused = useRef(false);
  const [isPaused, setPaused] = useState(false);
  const carouselOverride = useRef(false);
  const [carouselRequested, setCarouselRequested] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    readReducedMotion,
    serverReducedMotion,
  );

  const carouselStopped = isPaused || (reducedMotion && !carouselRequested);

  useEffect(() => {
    const page = root.current!;
    const motions: Animation[] = [];
    animations.current = motions;
    if (readReducedMotion()) return;
    const animate = (
      el: Element,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      const animation = el.animate(frames, options);
      motions.push(animation);
      return animation;
    };
    const draw = (selector: string, duration: number, delay: number, leave = false) => {
      const layer = page.querySelector<HTMLElement>(selector);
      if (!layer) return;
      animate(layer, [{ opacity: 1 }, { opacity: 1 }, { opacity: 0 }], {
        duration: duration + delay + 300,
        fill: "none",
      });
      for (const path of layer.querySelectorAll<SVGPathElement | SVGTextElement>(
        "path,text",
      )) {
        const length =
          path instanceof SVGTextElement
            ? path.getComputedTextLength() * 2
            : path.getTotalLength();
        path.style.strokeDasharray = `${length} ${length}`;
        animate(
          path,
          [
            { strokeDashoffset: String(length) },
            { strokeDashoffset: String(leave ? -length : 0) },
          ],
          { duration, delay, easing: "cubic-bezier(.77,0,.175,1)", fill: "backwards" },
        );
      }
    };
    draw(".mg-intro-outline", 1600, 1100);
    draw(".mg-intro-round", 1800, 900, true);
    draw(".mg-intro-arrow", 900, 900, true);
    const wordmark = page.querySelector(".mg-hero-heading h1")!;
    animate(wordmark, [{ opacity: 0 }, { opacity: 1 }], {
      duration: 700,
      delay: 2000,
      fill: "backwards",
      easing: "cubic-bezier(.18,.06,.23,1)",
    });
    for (const selector of [".mg-carousel"]) {
      animate(page.querySelector(selector)!, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 1100,
        delay: 1900,
        fill: "backwards",
        easing: "cubic-bezier(.18,.06,.23,1)",
      });
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (paused.current || readReducedMotion()) continue;
          for (const path of entry.target.querySelectorAll<SVGPathElement>("path")) {
            const length = path.getTotalLength();
            path.style.strokeDasharray = `${length} ${length}`;
            animate(
              path,
              [{ strokeDashoffset: String(length) }, { strokeDashoffset: "0" }],
              {
                duration: 1500,
                easing: "cubic-bezier(.77,0,.175,1)",
                fill: "backwards",
              },
            );
          }
        }
      },
      { threshold: 0.1 },
    );
    page.querySelectorAll(".mg-draw").forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      motions.forEach((a) => a.cancel());
    };
  }, []);

  useEffect(() => {
    for (const animation of animations.current) {
      if (reducedMotion) animation.finish();
      else if (isPaused) animation.pause();
      else if (animation.playState === "paused") animation.play();
    }
  }, [isPaused, reducedMotion]);

  useEffect(() => {
    const page = root.current!;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const stage = page.querySelector<HTMLElement>(".mg-circle-track")!;
    const crop = page.querySelector<HTMLElement>(".mg-circle-crop")!;
    const picture = page.querySelector<HTMLElement>(".mg-circle-image")!;
    const ring = page.querySelector<HTMLElement>(".mg-circle-ring")!;
    const carousel = page.querySelector<HTMLElement>(".mg-carousel")!;
    const columns = [...page.querySelectorAll<HTMLElement>(".mg-carousel-column")];
    const landscape = page.querySelector<HTMLImageElement>(".mg-circle-landscape")!;
    let width = innerWidth,
      height = innerHeight,
      start = 0,
      interval = 0,
      diameter = 0,
      terminal = 0;
    let positions: number[] = [],
      sizes: number[] = [],
      total = 0;
    let visible = true,
      raf = 0,
      last = 0,
      scrollDirty = true;
    const measure = () => {
      width = innerWidth;
      height = innerHeight;
      start = stage.getBoundingClientRect().top + scrollY;
      interval = stage.offsetHeight - height;
      diameter = Math.min(width * 0.4, height);
      terminal = Math.hypot(width, height);
      crop.style.width = `${terminal}px`;
      crop.style.height = `${terminal}px`;
      picture.style.width = `${terminal}px`;
      picture.style.height = `${terminal}px`;
      ring.style.width = `${diameter}px`;
      ring.style.height = `${diameter}px`;
      sizes = columns.map((c) => c.offsetWidth);
      total = sizes.reduce((a, b) => a + b, 0);
      let offset = width * 0.32;
      positions = sizes.map((size) => {
        const value = offset;
        offset += size;
        return value;
      });
      scrollDirty = true;
    };
    const updateScroll = () => {
      const p = Math.max(0, Math.min(1, (scrollY - start) / Math.max(1, interval)));
      const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const outer = diameter + (terminal - diameter) * ease;
      const inner = diameter + (terminal - diameter) * (1 - Math.pow(1 - p, 2));
      crop.style.transform = `translate(-50%, -50%) scale(${outer / terminal})`;
      picture.style.transform = `translate(-50%, -50%) scale(${inner / outer})`;
      ring.style.opacity = ease > 0.17 ? "0" : "1";
      // Keep the coastal ridge in the viewport without changing circle geometry.
      const shift = Math.min(
        inner * 0.12 * p,
        Math.max(0, (inner - Math.min(outer, height)) / 2),
      );
      landscape.style.transform = `translateY(${(shift / inner) * 100}%)`;
    };
    const onScroll = () => {
      scrollDirty = true;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(carousel);
    const tick = (now: number) => {
      const elapsed = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (scrollDirty) {
        updateScroll();
        scrollDirty = false;
      }
      if (visible)
        for (let i = 0; i < columns.length; i++) {
          if ((!preference.matches || carouselOverride.current) && !paused.current)
            positions[i] += (elapsed * width) / 16500;
          while (positions[i] > width) positions[i] -= total;
          columns[i].style.transform = `translate3d(${positions[i]}px,0,0)`;
        }
      raf = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(page.querySelector("main")!);
    measure();
    updateScroll();
    page.dataset.ready = "true";
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    const onPreferenceChange = () => {
      carouselOverride.current = false;
      setCarouselRequested(false);
      measure();
    };
    preference.addEventListener("change", onPreferenceChange);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      preference.removeEventListener("change", onPreferenceChange);
    };
  }, []);

  return (
    <>
      <SiteHeader />
      <div
        ref={root}
        className="morght-page"
        lang="ja"
        data-morght-version="2026-09-09-adelva-v3"
        data-paused={isPaused}
      >
        <a href="#main-content" className="mg-skip" data-skip-link>
          本文へスキップ
        </a>
        <div className="mg-paper">
          <div className="mg-shadow" aria-hidden="true" />
          <main id="main-content" className="mg-main">
            <section className="mg-intro" data-section="intro" aria-label="ADELVA">
              <div className="mg-hero-heading">
                <h1>
                  <span className="mg-sr">ADELVA</span>
                  <AdelvaWordmark />
                </h1>
                <AdelvaWordmark outline />
                <Vector name="intro-round" className="mg-intro-round" />
                <Vector name="intro-arrow" className="mg-intro-arrow" />
              </div>
              <div className="mg-carousel" data-motion="carousel">
                <div aria-hidden="true">
                  {photos.map((group, i) => (
                    <div
                      key={i}
                      className="mg-carousel-column"
                      style={
                        {
                          "--column-width": `${group.width}vw`,
                          "--mobile-column-width": `${group.mobile}vw`,
                        } as CSSProperties
                      }
                    >
                      {group.ids.map((id, j) => (
                        <div
                          key={id}
                          className="mg-carousel-photo"
                          style={{ transform: `rotate(${group.rotations[j]}deg)` }}
                        >
                          {/* Original generated fictional landscape / hotel. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/media/adelva/about-carousel/${id}.webp`}
                            srcSet={`/media/adelva/about-carousel/${id}-768.webp 768w, /media/adelva/about-carousel/${id}.webp 1536w`}
                            sizes="(max-width: 767px) 52vw, 38vw"
                            width={1536}
                            height={1024}
                            alt=""
                            loading="eager"
                            decoding="async"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <button
                  className="mg-pause"
                  aria-pressed={carouselStopped}
                  onClick={() => {
                    paused.current = !carouselStopped;
                    carouselOverride.current = carouselStopped && reducedMotion;
                    setCarouselRequested(carouselOverride.current);
                    setPaused(paused.current);
                  }}
                  type="button"
                >
                  {carouselStopped ? "Play motion" : "Pause motion"}
                </button>
              </div>
            </section>
            <section
              className="mg-mission"
              id="role"
              data-section="mission"
              aria-labelledby="mg-mission-title"
            >
              <div className="mg-purpose-lead">
                <h2 id="mg-mission-title" className="mg-purpose-title">
                  経営判断を、
                  <br />
                  現場で動く仕組みと成果へ。
                </h2>
                <div className="mg-purpose-signature">
                  <FounderSignature />
                  <p>kokoro nakagawa</p>
                </div>
              </div>
              <div className="mg-purpose-copy">
                <p>
                  ホテル・旅館の経営を、現場から動かしていく。ADELVAは、オーナー・経営者と総支配人・現場責任者の双方に向き合い、経営判断を日々の業務に落とし込み、改善が続く状態をつくる経営実装パートナーです。
                </p>
                <p>
                  収益を伸ばしたい。運営体制を整えたい。サービスの品質と生産性を高めたい。その課題は、人材、販売、業務、システムにまたがっています。何から着手するか、誰が担うか、現場でどう動かすか。私たちは、課題の把握と優先順位の整理から、ともに取り組みます。
                </p>
                <p>
                  「経営・運営統括」「収益・ブランド成長」「DX・IT・調達基盤」。この3つの支援領域から必要な施策を組み合わせ、一つの改善計画につなぎます。お客様とADELVAそれぞれの担当範囲、目標、進め方を明確にし、実行・実装から運用、効果の検証まで支援します。
                </p>
                <p>
                  大切にしているのは、支援が終わった後も、お客様自身で判断し、改善を続けられること。現場で使える仕組みと知識を引き継ぎ、経営と現場の両方に、次の一歩を進める力を残します。
                </p>
              </div>
            </section>
            <section
              className="mg-career"
              data-section="career"
              id="stance"
              aria-label="ADELVAの支援姿勢"
            >
              <div className="mg-circle-track" data-motion="circle">
                <div className="mg-circle-sticky">
                  <AdelvaCircleRing />
                  <div className="mg-circle-viewport">
                    <div className="mg-circle-crop">
                      <div className="mg-circle-image">
                        {/* Generated fictional landscape, not a client/property claim. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="mg-circle-landscape"
                          src="/media/adelva/about/coast-lossless.webp"
                          width="1254"
                          height="1254"
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section
              className="mg-company-info"
              id="company"
              data-section="company"
              aria-labelledby="mg-company-title"
            >
              <h2 id="mg-company-title">Company info</h2>
              <div className="mg-company-info-layout">
                <div className="mg-company-info-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/media/adelva/about-carousel/4.webp"
                    width={1536}
                    height={1024}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <dl>
                  <div>
                    <dt>社名</dt>
                    <dd>ADELVA 合同会社</dd>
                  </div>
                  <div>
                    <dt>設立年月日</dt>
                    <dd>2026年07月28日</dd>
                  </div>
                  <div>
                    <dt>資本金</dt>
                    <dd>100万円</dd>
                  </div>
                  <div>
                    <dt>代表取締役</dt>
                    <dd>中川　心</dd>
                  </div>
                  <div>
                    <dt>所在地（本社）</dt>
                    <dd>
                      〒666-0145
                      <br />
                      兵庫県川西市けやき坂2-67-6
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}

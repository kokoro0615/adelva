"use client";

/* The authorized source uses a measured 200/400/600/800px srcset. Native images
 * preserve that art direction; files are preoptimized and locally served. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { HomeFooter } from "@/components/home/home-footer";
import { Ambient } from "./ambient";
import {
  challengesHero,
  challengeBands as how,
  supportBands as why,
  type AdelvaBand,
} from "@/content/adelva-challenges";
import { contactCta } from "@/content/adelva-navigation";

function Arrow() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" aria-hidden="true">
      <path d="M1 9h17M10 1l8 8-8 8" stroke="currentColor" />
    </svg>
  );
}
function Strip({ card, index }: { card: AdelvaBand; index: number }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    const group = el?.firstElementChild;
    if (!el || !group) return;
    // Source data-speed=50 is converted to 2000/50 = 40 CSS pixels/second.
    const sync = () => {
      el.style.animationDuration = `${group.getBoundingClientRect().width / 40}s`;
    };
    const observer = new ResizeObserver(sync);
    observer.observe(group);
    sync();
    return () => observer.disconnect();
  }, []);
  const widthRatio = card.images.reduce(
    (sum, img) => sum + (card.square ? 1 : img.width / img.height),
    0,
  );
  return (
    <li className="ns-strip" data-ns-section={`strip-${index}`} id={card.id}>
      <div className="ns-strip-images" aria-hidden="true">
        <div
          ref={track}
          className={`ns-strip-track ${card.reverse ? "ns-left" : "ns-right"}`}
          style={
            {
              "--ns-distance": widthRatio,
              "--ns-duration": `${(widthRatio * 337.5) / 40}s`,
            } as CSSProperties
          }
        >
          {[0, 1, 2, 3].map((copy) => (
            <div className="ns-strip-group" key={copy}>
              {card.images.map((img) => {
                const ratio = card.square ? 1 : img.width / img.height;
                return (
                  <img
                    key={img.src}
                    src={img.src}
                    srcSet={img.srcSet ?? undefined}
                    sizes={`(max-width: 767px) ${257 * ratio}px, clamp(${300 * ratio}px, ${23.4375 * ratio}vw, ${450 * ratio}px)`}
                    style={{ aspectRatio: String(ratio) }}
                    width={img.width}
                    height={img.height}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <a href={card.href} className="ns-strip-link" aria-label={card.label}>
        <div className="ns-strip-bottom">
          <h3 className="ns-strip-label">{card.label}</h3>
          <p className="ns-strip-description">{card.body}</p>
        </div>
      </a>
    </li>
  );
}
function Heading({
  title,
  lead,
  id,
  english,
}: {
  title: string;
  lead?: string;
  id: string;
  english?: string;
}) {
  return (
    <hgroup className={`ns-heading ns-gutter${english ? " ns-chapter-heading" : ""}`}>
      <h2 id={id}>
        {english ? (
          <span className="ns-chapter-english" lang="en">
            {english}
          </span>
        ) : null}
        {english ? (
          <span className="ns-chapter-japanese" lang="ja">
            {title}
          </span>
        ) : (
          title
        )}
      </h2>
      {lead ? <p>{lead}</p> : null}
    </hgroup>
  );
}
function Quote({ closing = false }: { closing?: boolean }) {
  return (
    <section
      className="ns-quote"
      data-ns-section={closing ? "quote-future" : "quote-form"}
      aria-label={closing ? "ADELVAが目指す支援" : "ADELVAの考え方"}
    >
      <blockquote>
        <p className="ns-statement-lead">
          {closing
            ? "ともにつくるのは、支援の先も続く力。"
            : "経営と現場の課題を、一つの改善計画へ。"}
        </p>
        <p className="ns-statement-body">
          <span>
            {closing
              ? "判断し、実行し、確かめる。"
              : "ホテル・旅館の経営・運営、収益・ブランド、DX・IT・調達を横断し、"}
          </span>
          <span>
            {closing
              ? "改善が続く仕組みを、宿の中に。"
              : "担当範囲を明確に、実行・運用から検証・引継ぎまで支援します。"}
          </span>
        </p>
        <footer className="ns-statement-signature">
          <span>ADELVA</span>
          <span>HOSPITALITY MANAGEMENT PARTNER</span>
        </footer>
      </blockquote>
    </section>
  );
}

export function NosignerHome() {
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [slide, setSlide] = useState(0);
  const hero = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = root.current;
    const footer = page?.querySelector("[data-home-footer]");
    if (!page || !footer) return;
    const observer = new IntersectionObserver(([entry]) => {
      page.dataset.footerVisible = String(entry.isIntersecting);
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const priorLang = document.documentElement.lang;
    document.documentElement.lang = "ja";
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setPaused(query.matches);
    };
    const initFrame = requestAnimationFrame(() => {
      sync();
      query.addEventListener("change", sync);
      setReady(true);
    });
    return () => {
      cancelAnimationFrame(initFrame);
      query.removeEventListener("change", sync);
      document.documentElement.lang = priorLang;
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      // Read visibility at the six-second boundary, including immediately after
      // returning from the footer motion setting; no stale observer state.
      const bounds = hero.current?.getBoundingClientRect();
      if (
        bounds &&
        bounds.bottom > 0 &&
        bounds.top < window.innerHeight &&
        !document.hidden
      )
        setSlide((s) => (s + 1) % challengesHero.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      ref={root}
      className="ns-page"
      lang="ja"
      data-ns-ready={ready ? "true" : "false"}
      data-paused={paused ? "true" : "false"}
    >
      <a className="ns-skip" href="#main-content">
        本文へ移動
      </a>
      <Ambient paused={paused} />
      <main id="main-content" className="ns-main">
        <section className="ns-intro" data-ns-section="intro">
          <div
            className="ns-hero"
            ref={hero}
            role="region"
            aria-roledescription="カルーセル"
            aria-label="ADELVAの風景"
          >
            {challengesHero.map((item, index) => (
              <div
                key={item.image.src}
                className="ns-slide"
                data-active={index === slide}
                aria-hidden={index !== slide}
                inert={index !== slide}
              >
                <div className="ns-hero-image">
                  <img
                    src={item.image.src}
                    srcSet={item.image.srcSet}
                    sizes="(max-aspect-ratio: 1672/941) 178svh, 100vw"
                    width={item.image.width}
                    height={item.image.height}
                    alt={item.alt}
                    style={{ objectPosition: item.position }}
                    fetchPriority={index === 0 ? "high" : "low"}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
              </div>
            ))}
            <div className="ns-hero-copy ns-adelva-copy">
              <p className="ns-adelva-name">ADELVA</p>
              <p className="ns-adelva-eyebrow">HOSPITALITY MANAGEMENT PARTNER</p>
              <h1 className="ns-adelva-title">
                経営判断を、
                <br />
                現場で動く仕組みと成果へ。
              </h1>
            </div>
          </div>
          <div className="ns-keyvisual">
            <div className="ns-keyvisual-canvas">
              <div className="ns-keyvisual-content">
                <div className="ns-keyvisual-mark">ADELVA</div>
                <p>HOSPITALITY MANAGEMENT PARTNER</p>
              </div>
            </div>
          </div>
        </section>
        <div className="ns-index-main" data-ns-section="index-main">
          <div id="section-how" className="ns-how-group" data-ns-section="how-group">
            <section
              className="ns-categories"
              data-ns-section="how"
              aria-labelledby="ns-how-title"
            >
              <Heading
                id="ns-how-title"
                title="課題から探す"
                english="Your Challenges"
              />
              <ul className="ns-strips">
                {how.map((card, index) => (
                  <Strip key={card.id} card={card} index={index} />
                ))}
              </ul>
            </section>
            <Quote />
          </div>
          <section
            id="section-why"
            className="ns-categories ns-why"
            data-ns-section="why"
            aria-labelledby="ns-why-title"
          >
            <Heading id="ns-why-title" title="3つの支援領域" english="Our Expertise" />
            <ul className="ns-strips">
              {why.map((card, index) => (
                <Strip key={card.id} card={card} index={index + 5} />
              ))}
            </ul>
          </section>
          <Quote closing />
        </div>
      </main>
      <div className="ns-motion-control">
        <button
          className="ns-motion-setting"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "動きを再生" : "動きを一時停止"}
        </button>
      </div>
      <HomeFooter />
      <a className="ns-contact" href={contactCta.href}>
        相談する <Arrow />
      </a>
    </div>
  );
}

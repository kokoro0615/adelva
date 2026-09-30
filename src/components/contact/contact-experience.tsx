"use client";

import gsap from "gsap";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { submitContact } from "@/app/contact/actions";
import {
  consent,
  domains,
  fields,
  geometry,
  hero,
  messages,
  progressLabels,
  questions,
  roleOptions,
  send,
  summary,
  type ChallengeOption,
} from "@/content/adelva-contact";
import {
  emptyValues,
  initialState,
  LIMITS,
  STEP_FIELDS,
  validate,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from "@/lib/contact-form";
import { prefersMotion } from "@/lib/motion";
import { ContactPhoto, type ClearTileRef } from "./contact-photo";
import styles from "./contact.module.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;
type Regime = "d" | "m";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const DESKTOP = "(min-width: 720px)";
const regimeNow = (): Regime => (window.matchMedia(DESKTOP).matches ? "d" : "m");

/** Field → the control that receives focus for its error. */
const FOCUS_TARGET: Record<ContactField, string> = {
  challenge: "contact-challenge-0",
  role: "contact-role-0",
  message: "contact-message",
  company: "contact-company",
  name: "contact-name",
  email: "contact-email",
  tel: "contact-tel",
  consent: "contact-consent",
};

interface Clearing {
  p: number;
  target: number;
  tween?: gsap.core.Tween;
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span className={styles.err} id={id}>
      <i aria-hidden="true">!</i>
      {children}
    </span>
  );
}

export function ContactExperience({
  options,
  deliveryReady,
  children,
}: {
  options: readonly ChallengeOption[];
  deliveryReady: boolean;
  /** 「送信後の流れ」 and the notes, anchored to the same photograph. */
  children: ReactNode;
}) {
  const router = useRouter();
  const [serverState, formAction, pending] = useActionState(
    submitContact,
    initialState,
  );
  const [values, setValues] = useState<ContactValues>(() =>
    serverState.status === "invalid" ||
    serverState.status === "failed" ||
    serverState.status === "unavailable"
      ? serverState.values
      : emptyValues,
  );
  const [touched, setTouched] = useState<ReadonlySet<ContactField>>(() => new Set());
  const [submitted, setSubmitted] = useState(serverState.status === "invalid");
  const [showSummary, setShowSummary] = useState(serverState.status === "invalid");
  const [phase, setPhase] = useState<"idle" | "sending" | "leaving">("idle");
  const [current, setCurrent] = useState(0);
  const [typing, setTyping] = useState<string | null>(null);
  const [clearRegime, setClearRegime] = useState<Regime | null>(null);
  const [rail, setRail] = useState<{
    top: number;
    height: number;
    nodes: number[];
  } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const clearTiles = useRef(
    new Map<string, { tile: ClearTileRef; node: HTMLDivElement }>(),
  );
  const clearings = useRef(new Map<string, Clearing>());
  const paintFrame = useRef(0);
  const submissionId = useRef<string | null>(null);
  const sentAt = useRef(0);

  const allowed = useMemo(
    () => ({ challenge: options.map((o) => o.id), role: roleOptions.map((r) => r.id) }),
    [options],
  );
  const errors: ContactErrors = useMemo(
    () => validate(values, allowed),
    [values, allowed],
  );
  const serverErrors = serverState.status === "invalid" ? serverState.errors : {};
  const visibleError = (field: ContactField) =>
    submitted || touched.has(field)
      ? (errors[field] ?? serverErrors[field])
      : undefined;
  const ready = Object.keys(errors).length === 0;
  const busy = pending || phase !== "idle";

  const selected = options.filter((o) => values.challenge.includes(o.id));
  const domainIndexes = [
    ...new Set(
      selected.flatMap((o) =>
        o.domain === undefined || o.domain < 0 ? [] : [o.domain],
      ),
    ),
  ].sort((a, b) => a - b);
  const role = roleOptions.find((r) => r.id === values.role);

  const done = [
    values.challenge.length > 0,
    Boolean(values.role),
    !errors.message,
    !errors.name && !errors.email && !errors.tel,
  ];
  const stepHasError = STEP_FIELDS.map((list) => list.some((f) => visibleError(f)));

  /* ---------------------------------------------------------------- fields */
  const update = <F extends keyof ContactValues>(field: F, value: ContactValues[F]) =>
    setValues((v) => ({ ...v, [field]: value }));
  const touch = (field: ContactField) =>
    setTouched((t) => (t.has(field) ? t : new Set(t).add(field)));
  const text =
    (field: "message" | "company" | "name" | "email" | "tel") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      update(field, event.target.value);
  const describedBy = (field: ContactField, extra?: string) =>
    [extra, visibleError(field) ? `contact-${field}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  /* ---------------------------------------------------------------- clearings */
  const paint = useCallback(() => {
    paintFrame.current = 0;
    const stage = stageRef.current;
    if (!stage) return;
    const regime = regimeNow();
    const plate = stage.querySelector<HTMLElement>("[data-photo] > div");
    if (!plate) return;
    const s = stage.getBoundingClientRect();
    const p = plate.getBoundingClientRect();
    const g = regime === "d" ? geometry.desktop : geometry.mobile;
    const k = p.width / g.width;
    const rectOf = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        cx: r.left - s.left + r.width / 2,
        cy: r.top - s.top + r.height / 2,
        w: r.width,
        h: r.height,
      };
    };
    const pad =
      regime === "d"
        ? { x: 210, y: 150, bx: 170, by: 130 }
        : { x: 70, y: 110, bx: 90, by: 120 };
    const ellipses: { x: number; y: number; rx: number; ry: number }[] = [];
    for (const [key, c] of clearings.current) {
      if (c.p < 0.002) continue;
      if (key === "send") {
        const button = sendRef.current;
        if (!button) continue;
        const r = rectOf(button);
        const diag = Math.hypot(window.innerWidth, window.innerHeight);
        const rx =
          regime === "d"
            ? Math.max(900 * k, diag * 0.56)
            : Math.max(431 * k, diag * 0.5);
        const ry =
          regime === "d"
            ? Math.max(640 * k, diag * 0.4)
            : Math.max(549 * k, diag * 0.62);
        ellipses.push({ x: r.cx, y: r.cy, rx: rx * c.p, ry: ry * c.p });
        continue;
      }
      if (key.startsWith("bridge:")) {
        const [a, b] = key
          .slice(7)
          .split("|")
          .map((id) => stage.querySelector(`[data-clear-key="${id}"]`));
        if (!a || !b) continue;
        const ra = rectOf(a);
        const rb = rectOf(b);
        const dx = Math.abs(ra.cx - rb.cx);
        const dy = Math.abs(ra.cy - rb.cy);
        const rx = dx > dy ? dx / 2 + pad.bx * k : ra.w / 2 + pad.bx * k * 0.6;
        const ry = dx > dy ? ra.h / 2 + pad.by * k : dy / 2 + ra.h / 2 + pad.by * k;
        ellipses.push({
          x: (ra.cx + rb.cx) / 2,
          y: (ra.cy + rb.cy) / 2,
          rx: rx * c.p,
          ry: ry * c.p,
        });
        continue;
      }
      const el = stage.querySelector(`[data-clear-key="${key}"]`);
      if (!el) continue;
      const r = rectOf(el);
      ellipses.push({
        x: r.cx,
        y: r.cy,
        rx: (r.w / 2 + pad.x * k) * c.p,
        ry: (r.h / 2 + pad.y * k) * c.p,
      });
    }
    for (const { tile, node } of clearTiles.current.values()) {
      if (tile.regime !== regime) {
        node.hidden = true;
        continue;
      }
      const left = p.left - s.left;
      const top = p.top - s.top + tile.top * k;
      const height = tile.height * k;
      const layers = ellipses
        .filter((e) => e.y + e.ry > top && e.y - e.ry < top + height)
        .map(
          (e) =>
            `radial-gradient(${e.rx.toFixed(1)}px ${e.ry.toFixed(1)}px at ${(e.x - left).toFixed(1)}px ${(e.y - top).toFixed(1)}px, #000 0%, #000 42%, rgb(0 0 0 / 62%) 68%, transparent 100%)`,
        );
      const picture = node.firstElementChild as HTMLElement | null;
      if (!layers.length || !picture) {
        node.hidden = true;
        continue;
      }
      picture.style.maskImage = layers.join(", ");
      picture.style.setProperty("-webkit-mask-image", layers.join(", "));
      node.hidden = false;
    }
  }, []);

  const schedulePaint = useCallback(() => {
    if (!paintFrame.current) paintFrame.current = requestAnimationFrame(paint);
  }, [paint]);

  const setClearing = useCallback(
    (key: string, on: boolean) => {
      const map = clearings.current;
      let c = map.get(key);
      if (!c) {
        if (!on) return;
        c = { p: 0, target: 0 };
        map.set(key, c);
      }
      if (c.target === (on ? 1 : 0)) return;
      c.target = on ? 1 : 0;
      c.tween?.kill();
      const entry = c;
      const finish = () => {
        if (entry.target === 0 && entry.p <= 0.002) map.delete(key);
        schedulePaint();
      };
      if (!prefersMotion()) {
        entry.p = entry.target;
        finish();
        return;
      }
      entry.tween = gsap.to(entry, {
        p: entry.target,
        duration: on ? (key === "send" ? 1.6 : 1.2) : 0.4,
        // power2.out is cubic-bezier(0.33, 1, 0.68, 1), the --ease-panel token.
        ease: on ? "power3.out" : "power2.out",
        onUpdate: schedulePaint,
        onComplete: finish,
      });
    },
    [schedulePaint],
  );

  // Which clearings should exist: every chosen card, a bridge between chosen
  // neighbours, and the whole view around the button while sending.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const wanted = new Set<string>();
    const chosen = [
      ...values.challenge.map((id) => `challenge-${id}`),
      ...(values.role ? [`role-${values.role}`] : []),
    ];
    chosen.forEach((key) => wanted.add(key));
    const cards = values.challenge
      .map((id) =>
        stage.querySelector<HTMLElement>(`[data-clear-key="challenge-${id}"]`),
      )
      .filter((n): n is HTMLElement => Boolean(n));
    for (let i = 0; i < cards.length; i++)
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i].getBoundingClientRect();
        const b = cards[j].getBoundingClientRect();
        const sameRow =
          Math.abs(a.top - b.top) < a.height / 2 &&
          Math.abs(a.left - b.left) < a.width * 1.3;
        const sameColumn =
          Math.abs(a.left - b.left) < a.width / 2 &&
          Math.abs(a.top - b.top) < a.height * 1.6;
        if (sameRow || sameColumn)
          wanted.add(
            `bridge:${cards[i].dataset.clearKey}|${cards[j].dataset.clearKey}`,
          );
      }
    if (phase !== "idle") wanted.add("send");
    for (const key of wanted) setClearing(key, true);
    for (const key of clearings.current.keys())
      if (!wanted.has(key)) setClearing(key, false);
    schedulePaint();
  }, [values.challenge, values.role, phase, clearRegime, setClearing, schedulePaint]);

  const registerClear = useCallback(
    (tile: ClearTileRef, node: HTMLDivElement | null) => {
      const key = `${tile.regime}${tile.top}`;
      if (node) clearTiles.current.set(key, { tile, node });
      else clearTiles.current.delete(key);
    },
    [],
  );

  // Load the fog-lifted variants on the first sign of intent.
  const wantClear = useCallback(() => {
    setClearRegime((r) => r ?? regimeNow());
  }, []);
  useEffect(() => {
    const query = window.matchMedia(DESKTOP);
    const onChange = () => setClearRegime((r) => (r ? regimeNow() : r));
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  /* ---------------------------------------------------------------- layout-driven layers */
  const layout = useCallback(() => {
    const stage = stageRef.current;
    const flow = flowRef.current;
    const button = sendRef.current;
    const light = lightRef.current;
    if (!stage || !flow) return;
    const s = stage.getBoundingClientRect();
    const plate = stage.querySelector<HTMLElement>("[data-photo] > div");
    const regime = regimeNow();
    const k = plate
      ? plate.getBoundingClientRect().width / (regime === "d" ? 1440 : 390)
      : 1;
    if (button && light) {
      const b = button.getBoundingClientRect();
      const cx = b.left - s.left + b.width / 2;
      const cy = b.top - s.top + b.height / 2;
      const [dx, dy, w, h] =
        regime === "d" ? [760, 640, 1520, 1000] : [420, 560, 840, 860];
      Object.assign(light.style, {
        left: `${cx - dx * k}px`,
        top: `${cy - dy * k}px`,
        width: `${w * k}px`,
        height: `${h * k}px`,
      });
      light.hidden = false;
    }
    const f = flow.getBoundingClientRect();
    const nums = [...flow.querySelectorAll("[data-scene]")].map((scene) =>
      scene.querySelector("[data-num]"),
    );
    if (nums.length === 4 && nums.every(Boolean)) {
      const ys = nums.map(
        (n) => (n as Element).getBoundingClientRect().top - f.top + 11,
      );
      setRail((prev) => {
        const next = {
          top: ys[0],
          height: ys[3] - ys[0],
          nodes: ys.map((y) => y - ys[0]),
        };
        return prev &&
          prev.top === next.top &&
          prev.height === next.height &&
          prev.nodes.every((y, i) => y === next.nodes[i])
          ? prev
          : next;
      });
    }
    schedulePaint();
  }, [schedulePaint]);

  useIsomorphicLayoutEffect(() => {
    layout();
    const observer = new ResizeObserver(() => layout());
    if (flowRef.current) observer.observe(flowRef.current);
    if (stageRef.current) observer.observe(stageRef.current);
    document.fonts?.ready.then(() => layout());
    return () => observer.disconnect();
  }, [layout]);

  /* ---------------------------------------------------------------- scroll position */
  useEffect(() => {
    const scenes = [...(flowRef.current?.querySelectorAll("[data-scene]") ?? [])];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setCurrent(Number((entry.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-50% 0px -49% 0px" },
    );
    scenes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  // Gentle proximity snapping to the questions, only when motion is welcome.
  useEffect(() => {
    if (!prefersMotion()) return;
    const root = document.documentElement;
    const previous = root.style.scrollSnapType;
    root.style.scrollSnapType = "y proximity";
    return () => {
      root.style.scrollSnapType = previous;
    };
  }, []);

  /* ---------------------------------------------------------------- focus */
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    wantClear();
    const target = event.target as HTMLElement;
    const scene = target.closest<HTMLElement>("[data-scene]");
    const isText =
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLInputElement &&
        ["text", "email", "tel"].includes(target.type));
    setTyping(isText && scene ? (scene.dataset.scene ?? null) : null);
    const from = event.relatedTarget as HTMLElement | null;
    const previous = from?.closest?.("[data-scene]");
    if (scene && previous !== scene && target.matches(":focus-visible")) {
      const r = scene.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight)
        scene.scrollIntoView({
          block: "center",
          behavior: prefersMotion() ? "smooth" : "auto",
        });
    }
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as HTMLElement | null;
    if (!next || !flowRef.current?.contains(next)) setTyping(null);
  };

  /* ---------------------------------------------------------------- submit */
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true);
    const first = (Object.keys(errors) as ContactField[])[0];
    if (first) {
      setShowSummary(true);
      requestAnimationFrame(() =>
        document.getElementById(FOCUS_TARGET[first])?.focus(),
      );
      return;
    }
    setShowSummary(false);
    const data = new FormData(event.currentTarget);
    data.set("js", "1");
    submissionId.current ??= crypto.randomUUID();
    data.set("submissionId", submissionId.current);
    sentAt.current = performance.now();
    setPhase("sending");
    startTransition(() => formAction(data));
  };

  useEffect(() => {
    if (serverState.status === "idle") return;
    if (serverState.status === "sent") {
      submissionId.current = null;
      const wait = prefersMotion()
        ? Math.max(0, 1250 - (performance.now() - sentAt.current))
        : 0;
      const t1 = window.setTimeout(() => setPhase("leaving"), wait);
      const t2 = window.setTimeout(
        () => router.push("/contact/thanks"),
        wait + (prefersMotion() ? 420 : 0),
      );
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    const t = window.setTimeout(() => setPhase("idle"), 0);
    if (serverState.status === "invalid") {
      const first = Object.keys(serverState.errors)[0] as ContactField | undefined;
      if (first) document.getElementById(FOCUS_TARGET[first])?.focus();
    }
    return () => window.clearTimeout(t);
  }, [serverState, router]);

  /* ---------------------------------------------------------------- render */
  const sceneProps = (step: number, id: string) => ({
    id,
    "data-scene": id,
    "data-step": step,
    "data-active": typing === id ? "" : undefined,
  });
  const failure =
    serverState.status === "failed" || serverState.status === "unavailable"
      ? serverState
      : null;
  const summaryErrors = showSummary
    ? (Object.keys(errors) as ContactField[]).map((f) => ({
        field: f,
        message: errors[f] as string,
      }))
    : [];

  const progressNav = (kind: "rail" | "bar") =>
    progressLabels.map((label, i) => {
      const props = {
        href: `#${["q01", "q02", "q03", "q04"][i]}`,
        "aria-current": current === i ? ("step" as const) : undefined,
        "data-done": done[i],
      };
      const bang = stepHasError[i] ? (
        <span className={styles.bang} aria-label="入力内容を確認してください">
          !
        </span>
      ) : null;
      return kind === "rail" ? (
        <a
          key={label}
          className={styles.node}
          style={{ top: rail?.nodes[i] ?? 0 }}
          {...props}
        >
          <span className={styles.dot} />
          <span className={styles.nodeLabel}>
            {label}
            {bang}
          </span>
        </a>
      ) : (
        <a key={label} className={styles.step} {...props}>
          <span className={styles.dot} />
          <span className={styles.stepLabel}>
            {label}
            {bang}
          </span>
        </a>
      );
    });

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-stage
      onPointerEnter={wantClear}
      onTouchStart={wantClear}
    >
      <ContactPhoto
        mode="form"
        clearRegime={clearRegime}
        registerClear={registerClear}
        lightRef={lightRef}
        ready={ready}
      />
      <div
        ref={flowRef}
        className={styles.flow}
        data-typing={typing ?? undefined}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <header className={styles.intro}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowJp}>{hero.eyebrow}</span>
            <span className={styles.eyebrowRule} aria-hidden="true" />
            <span className={styles.eyebrowEn} lang="en">
              {hero.eyebrowEn}
            </span>
          </p>
          <h1 id="contact-title" className={styles.title}>
            {/* Desktop breaks after each line; mobile also inside each line. */}
            {[hero.titleMobile.slice(0, 2), hero.titleMobile.slice(2)].map(
              (pieces, line) => (
                <span key={line}>
                  {pieces.map((piece, i) => (
                    <span key={piece}>
                      {i > 0 && <br className={styles.mobileOnly} />}
                      <span style={{ "--i": line * 2 + i } as Vars}>{piece}</span>
                    </span>
                  ))}
                </span>
              ),
            )}
          </h1>
          {!deliveryReady && (
            <p className={styles.unavailable}>{messages.unavailable}</p>
          )}
        </header>

        <form
          ref={formRef}
          className={styles.form}
          action={formAction}
          onSubmit={onSubmit}
          noValidate
          aria-labelledby="contact-title"
          aria-busy={busy || undefined}
          data-contact-form
        >
          <fieldset
            {...sceneProps(0, "q01")}
            className={`${styles.scene} ${styles.q01}`}
            aria-describedby={
              visibleError("challenge") ? "contact-challenge-error" : undefined
            }
            aria-invalid={visibleError("challenge") ? true : undefined}
          >
            <legend className={styles.legend}>
              <span className={styles.num} aria-hidden="true" data-num>
                {questions.challenge.number}
              </span>
              <h2 className={styles.askSmall}>
                {questions.challenge.askMobile[0]}
                <br />
                {questions.challenge.askMobile[1]}
              </h2>
            </legend>
            <div className={styles.cards}>
              {options.map((option, i) => (
                <label
                  key={option.id}
                  className={styles.card}
                  data-clear-key={`challenge-${option.id}`}
                  style={{ "--i": i } as Vars}
                >
                  <input
                    id={`contact-challenge-${i}`}
                    type="checkbox"
                    name="challenge"
                    value={option.id}
                    checked={values.challenge.includes(option.id)}
                    onChange={(event) =>
                      update(
                        "challenge",
                        event.target.checked
                          ? options
                              .filter(
                                (o) =>
                                  o.id === option.id || values.challenge.includes(o.id),
                              )
                              .map((o) => o.id)
                          : values.challenge.filter((id) => id !== option.id),
                      )
                    }
                  />
                  <span className={styles.tick} aria-hidden="true" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {visibleError("challenge") && (
              <span
                className={`${styles.err} ${styles.errInline}`}
                id="contact-challenge-error"
              >
                <i aria-hidden="true">!</i>
                {visibleError("challenge")}
              </span>
            )}
            <div
              className={styles.map}
              aria-live="polite"
              data-empty={domainIndexes.length === 0}
            >
              <p
                className={styles.mapLabel}
                aria-hidden={domainIndexes.length === 0 || undefined}
              >
                {questions.challenge.related}
              </p>
              <p className={styles.tags}>
                {domainIndexes.map((d) => (
                  <span key={d} className={styles.tag}>
                    <b>{domains[d].number}</b>
                    {domains[d].label}
                  </span>
                ))}
              </p>
            </div>
            <p className={styles.scroll} aria-hidden="true">
              <span>{hero.scroll}</span>
              <i />
            </p>
          </fieldset>

          <nav className={styles.progress} aria-label="入力の進み具合">
            <div
              className={styles.progressInner}
              style={{ "--fill": current / 3 } as Vars}
            >
              <i className={styles.progressLine} aria-hidden="true" />
              <i className={styles.progressFill} aria-hidden="true" />
              {progressNav("bar")}
            </div>
          </nav>

          <fieldset
            {...sceneProps(1, "q02")}
            className={`${styles.scene} ${styles.q02}`}
            aria-describedby={visibleError("role") ? "contact-role-error" : undefined}
            aria-invalid={visibleError("role") ? true : undefined}
          >
            <legend className={styles.legend}>
              <span className={styles.num} aria-hidden="true" data-num>
                {questions.role.number}
              </span>
              <h2 className={styles.ask}>{questions.role.ask}</h2>
            </legend>
            <div className={`${styles.cards} ${styles.cards3}`}>
              {roleOptions.map((option, i) => (
                <label
                  key={option.id}
                  className={styles.card}
                  data-clear-key={`role-${option.id}`}
                >
                  <input
                    id={`contact-role-${i}`}
                    type="radio"
                    name="role"
                    value={option.id}
                    checked={values.role === option.id}
                    onChange={() => update("role", option.id)}
                  />
                  <span className={styles.tick} aria-hidden="true" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {visibleError("role") && (
              <span
                className={`${styles.err} ${styles.errInline}`}
                id="contact-role-error"
              >
                <i aria-hidden="true">!</i>
                {visibleError("role")}
              </span>
            )}
          </fieldset>

          <section
            {...sceneProps(2, "q03")}
            className={`${styles.scene} ${styles.q03}`}
            aria-labelledby="contact-message-label"
          >
            <span className={styles.num} aria-hidden="true" data-num>
              {questions.message.number}
            </span>
            <h2 className={styles.ask} id="contact-message-label">
              <label htmlFor="contact-message">
                {questions.message.askMobile[0]}
                <br className={styles.mobileOnly} />
                {questions.message.askMobile[1]}
              </label>
            </h2>
            <p className={styles.help} id="contact-message-help">
              {questions.message.help}
            </p>
            <div
              className={styles.area}
              data-invalid={Boolean(visibleError("message"))}
            >
              <textarea
                id="contact-message"
                name="message"
                rows={6}
                maxLength={LIMITS.message}
                required
                value={values.message}
                onChange={text("message")}
                onBlur={() => touch("message")}
                aria-invalid={visibleError("message") ? true : undefined}
                aria-describedby={describedBy("message", "contact-message-help")}
              />
            </div>
            {visibleError("message") && (
              <span
                className={`${styles.err} ${styles.errInline}`}
                id="contact-message-error"
              >
                <i aria-hidden="true">!</i>
                {visibleError("message")}
              </span>
            )}
          </section>

          <section
            {...sceneProps(3, "q04")}
            className={`${styles.scene} ${styles.q04}`}
            aria-labelledby="contact-details-title"
          >
            <span className={styles.num} aria-hidden="true" data-num>
              {questions.contact.number}
            </span>
            <h2 className={styles.ask} id="contact-details-title">
              {questions.contact.ask}
            </h2>
            <div className={styles.fields}>
              {(
                [
                  ["company", "text", "organization", undefined],
                  ["name", "text", "name", undefined],
                  ["email", "email", "email", "email"],
                  ["tel", "tel", "tel", "tel"],
                ] as const
              ).map(([field, type, autoComplete, inputMode]) => {
                const optional = field === "company";
                const error = visibleError(field);
                return (
                  <div key={field} className={styles.field}>
                    <label htmlFor={`contact-${field}`}>
                      {fields[field].label}
                      {optional && <em>{fields.company.optional}</em>}
                    </label>
                    <input
                      id={`contact-${field}`}
                      name={field}
                      type={type}
                      autoComplete={autoComplete}
                      inputMode={inputMode}
                      maxLength={LIMITS[field]}
                      required={!optional}
                      spellCheck={
                        field === "company" || field === "name" ? undefined : false
                      }
                      value={values[field]}
                      onChange={text(field)}
                      onBlur={() => touch(field)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={describedBy(field)}
                    />
                    {error && (
                      <ErrorText id={`contact-${field}-error`}>{error}</ErrorText>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className={styles.summary}
              role="group"
              aria-labelledby="contact-summary-label"
            >
              <p className={styles.sumLabel} id="contact-summary-label">
                {summary.label}
              </p>
              <div className={styles.sumRow} aria-live="polite">
                {selected.length || role ? (
                  <>
                    <span className={styles.sumGroup}>
                      {selected.map((o) => (
                        <span key={o.id} className={styles.chip}>
                          {o.label}
                        </span>
                      ))}
                      {role && (
                        <span key={role.id} className={styles.chip}>
                          {role.label}
                        </span>
                      )}
                    </span>
                    {domainIndexes.length > 0 && (
                      <>
                        <span className={styles.arrow} aria-hidden="true" />
                        <span className={styles.sumGroup}>
                          {domainIndexes.map((d) => (
                            <span key={d} className={styles.chip}>
                              <b>{domains[d].number}</b>
                              {domains[d].label}
                            </span>
                          ))}
                        </span>
                      </>
                    )}
                  </>
                ) : null}
              </div>
            </div>

            <div className={styles.consent}>
              <span className={styles.box}>
                <input
                  id="contact-consent"
                  type="checkbox"
                  name="consent"
                  checked={values.consent}
                  onChange={(event) => update("consent", event.target.checked)}
                  aria-invalid={visibleError("consent") ? true : undefined}
                  aria-describedby={describedBy("consent")}
                />
                <i aria-hidden="true" />
              </span>
              <label htmlFor="contact-consent">
                <a
                  href={consent.href}
                  target="_blank"
                  rel="noopener"
                  aria-describedby="contact-consent-new-tab"
                >
                  {consent.link}
                </a>
                {consent.rest}
              </label>
              <span id="contact-consent-new-tab" className={styles.visuallyHidden}>
                {consent.newTab}
              </span>
              {visibleError("consent") && (
                <ErrorText id="contact-consent-error">
                  {visibleError("consent")}
                </ErrorText>
              )}
            </div>

            <div className={styles.alerts}>
              {summaryErrors.length > 0 && (
                <div ref={summaryRef} className={styles.alert} role="alert">
                  <strong>
                    <span className={styles.bang} aria-hidden="true">
                      !
                    </span>
                    {messages.summary}
                  </strong>
                  <ul>
                    {summaryErrors.map(({ field, message }) => (
                      <li key={field}>
                        <a
                          href={`#${FOCUS_TARGET[field]}`}
                          onClick={(event) => {
                            event.preventDefault();
                            document.getElementById(FOCUS_TARGET[field])?.focus();
                          }}
                        >
                          {message}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {failure && phase === "idle" && (
                <div key={failure.at} className={styles.alert} role="alert">
                  <strong>
                    <span className={styles.bang} aria-hidden="true">
                      !
                    </span>
                    {failure.status === "unavailable"
                      ? messages.unavailable
                      : messages.failed}
                  </strong>
                </div>
              )}
            </div>

            <div className={styles.trap} aria-hidden="true">
              <label>
                website
                <input
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </label>
            </div>

            <button
              ref={sendRef}
              className={styles.send}
              type="submit"
              data-ready={ready}
              aria-disabled={busy || undefined}
              data-busy={busy || undefined}
            >
              <span>{busy ? send.sending : send.label}</span>
              <span className={styles.sendArrow} aria-hidden="true" />
            </button>
          </section>
        </form>

        <nav
          className={styles.rail}
          aria-label="入力の進み具合"
          data-measured={Boolean(rail)}
          style={rail ? { top: rail.top, height: rail.height } : undefined}
        >
          <i className={styles.railLine} aria-hidden="true" />
          <i
            className={styles.railFill}
            aria-hidden="true"
            style={
              {
                "--fill":
                  rail && rail.height ? (rail.nodes[current] ?? 0) / rail.height : 0,
              } as Vars
            }
          />
          {progressNav("rail")}
        </nav>
      </div>
      {children}
      {phase === "leaving" && <div className={styles.leaving} aria-hidden="true" />}
    </div>
  );
}

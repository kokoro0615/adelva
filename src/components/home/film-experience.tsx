"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { getAsset, getVideoAsset } from "@/content/assets";
import { lockScroll } from "@/lib/motion";

type OpenFilm = (opener: HTMLButtonElement) => void;

const FilmContext = createContext<OpenFilm | null>(null);

/**
 * One HOME-scoped film portal shared by both measured Watch Film triggers.
 *
 * The film source is mounted only after the first request. Measured reason: the
 * approved master is a 235 MB MP4 whose `moov` atom is not at the head of the
 * file, so a browser asked to `preload="metadata"` has to read to the end of
 * the file to find it. With the `<source>` mounted eagerly, a single HOME load
 * fetched **224.76 MB** of film before anyone had asked to watch anything.
 * Arming on demand and preloading nothing removes that from the page budget
 * entirely; the poster still renders the frame the target shows.
 */
export function FilmExperience({ children }: { readonly children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const film = getVideoAsset("white-desert-film");
  const poster = getAsset("watch-film-preview");

  const showFilm = useCallback<OpenFilm>((opener) => {
    openerRef.current = opener;
    setArmed(true);
    setOpen(true);
  }, []);

  const closeFilm = useCallback(() => {
    setOpen(false);
    const opener = openerRef.current;
    openerRef.current = null;
    window.requestAnimationFrame(() => opener?.isConnected && opener.focus());
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!open) {
      videoRef.current?.pause();
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) dialog.showModal();
    const release = lockScroll();
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());

    // The source was just mounted: run resource selection so `currentSrc`
    // resolves, then start playback from the opening gesture. Nothing is
    // fetched before this point.
    const player = videoRef.current;
    if (player) {
      player.load();
      void player.play().catch(() => {
        /* a refused autoplay leaves the poster and the native controls */
      });
    }

    return () => {
      window.cancelAnimationFrame(focusFrame);
      release();
    };
  }, [open]);

  return (
    <FilmContext.Provider value={showFilm}>
      {children}
      <dialog
        ref={dialogRef}
        className="film-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          closeFilm();
        }}
        onClose={() => {
          setOpen(false);
          videoRef.current?.pause();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeFilm();
        }}
      >
        <h2 id={titleId} className="visually-hidden">
          White Desert film
        </h2>
        <button
          ref={closeRef}
          type="button"
          className="film-dialog__close"
          onClick={closeFilm}
        >
          <span>Close</span>
          <span className="film-dialog__close-glyph" aria-hidden="true" />
        </button>
        <div className="film-dialog__stage">
          <video
            ref={videoRef}
            className="film-dialog__video"
            controls
            playsInline
            preload="none"
            poster={poster.src}
          >
            {armed ? <source src={film.src} type="video/mp4" /> : null}
          </video>
        </div>
      </dialog>
    </FilmContext.Provider>
  );
}

export function WatchFilmButton({
  children,
  onClick,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const showFilm = useContext(FilmContext);

  if (!showFilm) {
    throw new Error("WatchFilmButton must be rendered inside FilmExperience");
  }

  return (
    <button
      {...props}
      ref={triggerRef}
      type="button"
      aria-haspopup="dialog"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && triggerRef.current) showFilm(triggerRef.current);
      }}
    >
      {children}
    </button>
  );
}

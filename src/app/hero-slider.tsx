"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { content, productPath, type Product } from "../lib/content";
import { ProductLink } from "./product-link";

const AUTO_MS = 4500;
const SWIPE_PX = 48;

const slides: Product[] = (() => {
  const grand = content.products.find((p) => p.name === "ЖК Грандберег");
  if (!grand) return content.products;
  return [grand, ...content.products.filter((p) => p.id !== grand.id)];
})();

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [captionKey, setCaptionKey] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startDrag = useRef(0);
  const widthRef = useRef(1);
  const pointerId = useRef<number | null>(null);

  const goTo = useCallback((next: number) => {
    const len = slides.length;
    setIndex((prev) => {
      const value = ((next % len) + len) % len;
      if (value !== prev) setCaptionKey((k) => k + 1);
      return value;
    });
    setDragPx(0);
  }, []);

  const onAutoAdvance = useEffectEvent(() => {
    if (paused || dragging) return;
    goTo(index + 1);
  });

  useEffect(() => {
    if (paused || dragging || slides.length < 2) return;
    const id = window.setInterval(() => onAutoAdvance(), AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, dragging, index]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    widthRef.current = el.clientWidth || 1;
    startX.current = e.clientX;
    startDrag.current = 0;
    pointerId.current = e.pointerId;
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    setPaused(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (pointerId.current !== e.pointerId || !dragging) return;
    const dx = e.clientX - startX.current;
    startDrag.current = dx;
    setDragPx(dx);
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (pointerId.current !== e.pointerId) return;
    const el = trackRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    pointerId.current = null;
    const dx = startDrag.current;
    const threshold = Math.min(SWIPE_PX, widthRef.current * 0.18);
    setDragging(false);
    if (dx <= -threshold) goTo(index + 1);
    else if (dx >= threshold) goTo(index - 1);
    else setDragPx(0);
    window.setTimeout(() => setPaused(false), AUTO_MS);
  }

  const active = slides[index];
  const offset = `calc(${-index * 100}% + ${dragPx}px)`;

  return (
    <div
      className="hero-photo hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!dragging) setPaused(false);
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        ref={trackRef}
        className={`hero-slider-track${dragging ? " is-dragging" : ""}`}
        style={{ transform: `translate3d(${offset}, 0, 0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="group"
        aria-roledescription="карусель"
        aria-label="Жилые комплексы"
      >
        {slides.map((product, i) => (
          <div
            key={product.id}
            className={`hero-slide${i === index ? " is-active" : ""}`}
            aria-hidden={i !== index}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              draggable={false}
              fetchPriority={i === 0 ? "high" : "auto"}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      <div className="photo-caption" key={captionKey}>
        <span className="photo-caption-copy">
          <small>В нашем каталоге</small>
          <b>{active.name}</b>
        </span>
        <ProductLink
          href={productPath(active)}
          className="photo-open"
          aria-label={`Подробнее о ${active.name}`}
        >
          <span aria-hidden="true">↗</span>
        </ProductLink>
      </div>

      <div className="hero-dots" role="tablist" aria-label="Слайды каталога">
        {slides.map((product, i) => (
          <button
            key={product.id}
            type="button"
            role="tab"
            className={i === index ? "active" : undefined}
            aria-selected={i === index}
            aria-label={`${product.name}, слайд ${i + 1} из ${slides.length}`}
            onClick={() => {
              goTo(i);
              setPaused(true);
              window.setTimeout(() => setPaused(false), AUTO_MS);
            }}
          >
            {i === index && !paused && !dragging ? (
              <span
                className="hero-dot-progress"
                style={{ animationDuration: `${AUTO_MS}ms` }}
              />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

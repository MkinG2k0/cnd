"use client";

import Image from "next/image";
import { useState } from "react";

export function PropertyGallery({
  cover,
  images,
  name,
}: {
  cover: string;
  images: string[];
  name: string;
}) {
  const slides = [cover, ...images.filter((url) => url !== cover)];
  const [index, setIndex] = useState(0);
  const current = slides[index] ?? cover;

  return (
    <div className="property-media">
      <Image
        src={current}
        alt={name}
        width={960}
        height={660}
        sizes="(max-width: 900px) 100vw, 50vw"
        quality={75}
        preload={index === 0}
      />
      {slides.length > 1 ? (
        <div className="property-thumbs" role="list">
          {slides.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={i === index ? "is-active" : undefined}
              aria-label={`Фото ${i + 1}`}
              onClick={() => setIndex(i)}
            >
              <Image src={src} alt="" width={120} height={80} sizes="120px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

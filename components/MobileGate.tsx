"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isMobileBlocked } from "@/lib/is-mobile";
import { BUY_ME_A_COFFEE_URL, SITE_NAME } from "@/lib/site";

export function MobileGate({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 720px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const noHover = window.matchMedia("(hover: none)");

    const sync = () => setBlocked(isMobileBlocked());
    sync();

    narrow.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    noHover.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
      noHover.removeEventListener("change", sync);
    };
  }, []);

  if (blocked === null) {
    return <div className="mobile-gate" aria-hidden="true" />;
  }

  if (blocked) {
    return (
      <main className="mobile-gate">
        <div className="mobile-gate__stack">
          <a
            className="mobile-gate__pour"
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee"
          />
          <p className="mobile-gate__body">
            {SITE_NAME} runs local LLMs in your browser and isn&apos;t built for
            mobile. Please use a computer.
          </p>
        </div>
      </main>
    );
  }

  return children;
}

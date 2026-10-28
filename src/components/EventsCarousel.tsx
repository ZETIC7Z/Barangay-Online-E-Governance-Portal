import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

/**
 * Events & Activities — "tilted carousel"
 * Ported from CodePen vii120/pen/VYmmdMK (React + motion). The original spring physics,
 * rotateY tilt, scale, caption blur/opacity and dot controls are kept as-is. Adaptations:
 *  - Tailwind v4 utilities rewritten as Tailwind v3 arbitrary values.
 *  - Controls sit under the carousel instead of `fixed` to the viewport.
 *  - Autoplay with a seamless infinite loop (slides are rendered three times and the index is
 *    silently re-centred after each move, so it never rewinds).
 */

const ASSETS = [
  { src: '/events/event-01.jpg', title: 'Anti-Illegal Drugs Campaign' },
  { src: '/events/event-02.jpg', title: 'Team Matatag • Basketball Cup 2026' },
  { src: '/events/event-03.jpg', title: 'Basketball Cup Opening Ceremony' },
  { src: '/events/event-04.jpg', title: 'Community Sports Day' },
  { src: '/events/event-05.jpg', title: 'SK Matatag Feeding Program' },
  { src: '/events/event-06.jpg', title: 'Basketball Cup Parade' },
  { src: '/events/event-07.jpg', title: 'SK Outreach for the Children' },
  { src: '/events/event-08.jpg', title: 'Team Matatag at the Gym' },
  { src: '/events/event-09.jpg', title: 'Community Snack Distribution' },
  { src: '/events/event-10.jpg', title: 'Parade of Barangay Teams' },
  { src: '/events/event-11.jpg', title: 'SK Volunteers in Action' },
];

const N = ASSETS.length;
const SLIDES = [...ASSETS, ...ASSETS, ...ASSETS];
const AUTOPLAY_MS = 3200;

export const EventsCarousel: React.FC = () => {
  // Start in the middle copy, on the 4th slide like the original pen (useState(3)).
  const [activeIndex, setActiveIndex] = useState(N + 3);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const recenterTimer = useRef<number | undefined>(undefined);

  // After a move lands outside the middle copy, jump back by N with no animation (visually identical).
  useEffect(() => {
    window.clearTimeout(recenterTimer.current);
    if (activeIndex >= 2 * N || activeIndex < N) {
      recenterTimer.current = window.setTimeout(() => {
        setInstant(true);
        setActiveIndex((prev) => (prev >= 2 * N ? prev - N : prev < N ? prev + N : prev));
      }, 1000);
    }
    return () => window.clearTimeout(recenterTimer.current);
  }, [activeIndex]);

  useEffect(() => {
    if (!instant) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    return () => cancelAnimationFrame(id);
  }, [instant]);

  const toPrev = useCallback(() => setActiveIndex((prev) => prev - 1), []);
  const toNext = useCallback(() => setActiveIndex((prev) => prev + 1), []);
  const toSlide = (index: number) => setActiveIndex(index);

  // Continuous autoplay; pauses on hover/focus and when the tab is hidden.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (!document.hidden) toNext();
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, toNext]);

  const activeDot = ((activeIndex % N) + N) % N;
  const springTrack = instant ? { duration: 0 } : { type: 'spring' as const, bounce: 0.2, duration: 0.8 };
  const springSlide = instant ? { duration: 0 } : { type: 'spring' as const, bounce: 0.1, duration: 1 };

  return (
    <section id="events-section" className="relative py-16 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">
            <CalendarDays className="w-3.5 h-3.5" /> Community Life in Matatag
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
            Events &amp; Activities
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2">
            Highlights from Barangay Matatag and SK Matatag programs, sports, and community outreach.
          </p>
        </motion.div>
      </div>

      <div
        className="p-2 text-neutral-800 dark:text-neutral-100 select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {/* carousel wrapper */}
        <div className="w-[11rem] md:w-[16rem] mt-10 mx-auto">
          {/* slides container */}
          <motion.div
            className="flex w-fit"
            animate={{ x: `${(-activeIndex * 100) / SLIDES.length}%` }}
            transition={springTrack}
          >
            {SLIDES.map((item, i) => {
              const isActive = activeIndex === i;
              return (
                <div className="[perspective:800px]" key={i}>
                  <motion.div
                    className="w-[11rem] md:w-[16rem] aspect-[3/4] flex flex-col items-center gap-2 will-change-transform"
                    animate={{ rotateY: (activeIndex - i) * 60, scale: isActive ? 1 : 0.85 }}
                    transition={springSlide}
                  >
                    <img
                      src={item.src}
                      alt={item.title}
                      loading="lazy"
                      draggable={false}
                      className="w-full h-full object-cover rounded-lg shadow-lg cursor-pointer"
                      onClick={() => toSlide(i)}
                    />

                    <motion.div
                      className="text-xs md:text-sm font-semibold whitespace-nowrap will-change-[opacity,filter]"
                      animate={{ filter: isActive ? 'blur(0px)' : 'blur(2px)', opacity: isActive ? 1 : 0 }}
                      transition={instant ? { duration: 0 } : undefined}
                    >
                      {item.title}
                    </motion.div>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* controls */}
        <div className="mt-12 w-fit px-2 mx-auto flex items-center gap-4 justify-center text-neutral-700 dark:text-neutral-200 rounded-full bg-neutral-200/50 dark:bg-slate-800/70 backdrop-blur-[4px] border border-neutral-200/80 dark:border-slate-700 shadow-sm">
          {/* prev button */}
          <button onClick={toPrev} className="p-2 cursor-pointer" aria-label="Previous event">
            <ChevronLeft />
          </button>
          {/* slide dots */}
          <div className="w-[200px] flex justify-center items-center gap-2">
            {ASSETS.map((_, i) => (
              <div
                key={i}
                role="button"
                aria-label={`Go to event ${i + 1}`}
                onClick={() => toSlide(N + i)}
                className={`rounded-full cursor-pointer h-2 bg-current transition-[width,opacity] duration-300 ${
                  activeDot === i ? 'w-7 opacity-100' : 'w-2 opacity-30'
                }`}
              ></div>
            ))}
          </div>
          {/* next button */}
          <button onClick={toNext} className="p-2 cursor-pointer" aria-label="Next event">
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
};

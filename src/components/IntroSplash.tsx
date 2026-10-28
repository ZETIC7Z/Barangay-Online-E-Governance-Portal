import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Desktop-only 10-second edge-to-edge cinematic intro.
 * - Plays /intro/intro.mp4 full-screen (100vw x 100vh, no scrollbars).
 * - At 9.0s (1 second before the 10.0s video ends), smoothly fades out the video to pure black (#000000) over 1.0s.
 * - Holds pure black (#000000) for 1.5 seconds after the video ends at 10.0s so the video never flashes again.
 * - Smoothly dissolves the black curtain (1.4s) so the main site slowly fades in from dark black.
 */

export const shouldPlayIntro = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('intro') === '0') return false;
  if (params.get('intro') === '1') return true;
  return window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;
};

export const IntroSplash: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeToBlack, setFadeToBlack] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  // Hide page scrollbars during the edge-to-edge intro
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // Start playback and schedule exact 9.0s fade-out + 10.0s end + 1.5s black hold
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {
      setFadeToBlack(true);
      setVideoEnded(true);
    });

    // Guarantee fade-out starts at 9.0s even if timeupdate granularity varies
    const fadeTimer = window.setTimeout(() => {
      setFadeToBlack(true);
    }, 9000);

    // Safety fallback if video stalls or finishes at 10.0s
    const endTimer = window.setTimeout(() => {
      setFadeToBlack(true);
      setVideoEnded(true);
    }, 10050);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(endTimer);
    };
  }, []);

  // Once the 10s video has faded to black and ended, hold pure black for 1.5 seconds
  // before revealing the main site from dark black.
  useEffect(() => {
    if (!videoEnded) return;
    setFadeToBlack(true);
    const holdBlackTimer = window.setTimeout(() => {
      finish();
    }, 1500);
    return () => window.clearTimeout(holdBlackTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoEnded]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const dur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 10;
    if (v.currentTime >= Math.max(0, dur - 1.0) || v.currentTime >= 9.0) {
      if (!fadeToBlack) {
        setFadeToBlack(true);
      }
    }
  };

  return (
    <motion.div
      key="intro-splash"
      className="fixed inset-0 z-[10000] bg-black overflow-hidden select-none"
      style={{ width: '100vw', height: '100vh' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src="/intro/intro.mp4"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          opacity: fadeToBlack ? 0 : 1,
          transition: 'opacity 1000ms ease-in-out',
        }}
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        controls={false}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setFadeToBlack(true);
          setVideoEnded(true);
        }}
        onError={() => {
          setFadeToBlack(true);
          setVideoEnded(true);
        }}
      />

      {/* Persistent pure-black curtain that fades in at 9.0s and stays solid black through exit */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: fadeToBlack ? 1 : 0,
          transition: 'opacity 1000ms ease-in-out',
        }}
      />
    </motion.div>
  );
};

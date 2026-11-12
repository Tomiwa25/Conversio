'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { clsx } from 'clsx';

export interface WaveformProps {
  /**
   * A live `AnalyserNode`. When provided, bar heights are read from the real
   * audio stream in a rAF loop. When omitted, the waveform idles at a small
   * ambient height so it never looks dead.
   */
  analyser?: AnalyserNode | null;
  /** Total height of the waveform band, in px. */
  height?: number;
  /** Number of bars. Defaults to a denser trace for hero, sparser for tiles. */
  bars?: number;
  /** Bar width, in px. Narrower bars read as more "instrument". */
  barWidth?: number;
  className?: string;
  /** Decorative only when it carries no information (landing page). */
  'aria-hidden'?: boolean;
}

/**
 * A live waveform. The ONLY animated element that is ever purely decorative,
 * and even then it idles quietly. When `analyser` is provided it is a data
 * display, not an ornament.
 */
export const Waveform: React.FC<WaveformProps> = ({
  analyser,
  height = 44,
  bars = 32,
  barWidth = 2,
  className,
  'aria-hidden': ariaHidden = true,
}) => {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const raf = useRef<number | null>(null);

  // When we have real audio, sample frequency bins once per frame.
  useEffect(() => {
    if (!analyser) return;

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    let mounted = true;

    const loop = () => {
      if (!mounted) return;
      analyser.getByteFrequencyData(buffer);

      // Compress the spectrum into `bars` buckets and scale to px. High
      // frequencies carry less energy, so we bias toward the lower half.
      const binsPerBar = Math.max(1, Math.floor(buffer.length / bars));
      for (let i = 0; i < bars; i += 1) {
        let sum = 0;
        for (let j = 0; j < binsPerBar; j += 1) sum += buffer[i * binsPerBar + j] || 0;
        const avg = sum / binsPerBar;
        const ratio = Math.pow(avg / 255, 1.4);
        const h = Math.max(2, ratio * height);
        const el = refs.current[i];
        if (el) el.style.height = `${h.toFixed(1)}px`;
      }
      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [analyser, bars, height]);

  // When idling, seed the bars to a gently varied resting shape so the
  // waveform reads as a trace rather than a flat line.
  const idleHeights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const wave = Math.abs(Math.sin(i * 0.55)) * 0.55 + 0.25;
        return Math.round(Math.max(3, wave * height * 0.55));
      }),
    [bars, height],
  );

  return (
    <div
      className={clsx('flex items-center justify-between', className)}
      style={{ height }}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : 'Audio activity'}
      aria-hidden={ariaHidden || undefined}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={clsx(
            'wave-bar flex-none rounded-[1px] bg-signal/80 transition-[height] duration-75 ease-out',
          )}
          style={{
            width: barWidth,
            height: analyser ? 2 : idleHeights[i],
          }}
        />
      ))}
    </div>
  );
};

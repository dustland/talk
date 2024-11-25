import { useEffect, useRef } from "react";

const dataMap = new WeakMap();

const normalizeArray = (
  data: Float32Array,
  m: number,
  downsamplePeaks: boolean = false,
  memoize: boolean = false
) => {
  let cache, mKey, dKey;
  if (memoize) {
    mKey = m.toString();
    dKey = downsamplePeaks.toString();
    cache = dataMap.has(data) ? dataMap.get(data) : {};
    dataMap.set(data, cache);
    cache[mKey] = cache[mKey] || {};
    if (cache[mKey][dKey]) {
      return cache[mKey][dKey];
    }
  }
  const n = data.length;
  const result = new Array(m);
  if (m <= n) {
    // Downsampling
    result.fill(0);
    const count = new Array(m).fill(0);
    for (let i = 0; i < n; i++) {
      const index = Math.floor(i * (m / n));
      if (downsamplePeaks) {
        // take highest result in the set
        result[index] = Math.max(result[index], Math.abs(data[i]));
      } else {
        result[index] += Math.abs(data[i]);
      }
      count[index]++;
    }
    if (!downsamplePeaks) {
      for (let i = 0; i < result.length; i++) {
        result[i] = result[i] / count[i];
      }
    }
  } else {
    for (let i = 0; i < m; i++) {
      const index = (i * (n - 1)) / (m - 1);
      const low = Math.floor(index);
      const high = Math.ceil(index);
      const t = index - low;
      if (high >= n) {
        result[i] = data[n - 1];
      } else {
        result[i] = data[low] * (1 - t) + data[high] * t;
      }
    }
  }
  if (memoize) {
    cache[mKey as string][dKey as string] = result;
  }
  return result;
};

const WavRenderer = {
  drawBars: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    color: string,
    pointCount: number = 0,
    barWidth: number = 0,
    barSpacing: number = 0,
    center: boolean = false
  ) => {
    pointCount = Math.floor(
      Math.min(
        pointCount,
        (canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing)
      )
    );
    if (!pointCount) {
      pointCount = Math.floor(
        (canvas.width - barSpacing) / (Math.max(barWidth, 1) + barSpacing)
      );
    }
    if (!barWidth) {
      barWidth = (canvas.width - barSpacing) / pointCount - barSpacing;
    }
    const points = normalizeArray(data, pointCount, true);
    for (let i = 0; i < pointCount; i++) {
      const amplitude = Math.abs(points[i]);
      const height = Math.max(1, amplitude * canvas.height);
      const x = barSpacing + i * (barWidth + barSpacing);
      const y = center ? (canvas.height - height) / 2 : canvas.height - height;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, height);
    }
  },
};

export function WaveformAnimation({ 
  className = "",
  audioData
}: { 
  className?: string;
  audioData?: Float32Array;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 48;
    canvas.height = 48;

    const animate = (timestamp: number) => {
      if (!canvas || !ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (audioData) {
        // Use actual audio data if available
        WavRenderer.drawBars(canvas, ctx, audioData, "currentColor", 12, 2, 1, true);
      } else {
        // Fallback to simulated data
        const frequency = 1;
        const sampleRate = 44100;
        const duration = 1;
        const numSamples = Math.floor(sampleRate * duration);
        const data = new Float32Array(numSamples);

        const phase = (timeRef.current * frequency * Math.PI * 2) % (Math.PI * 2);
        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          data[i] = 
            0.6 * Math.sin(2 * Math.PI * frequency * t + phase) +
            0.3 * Math.sin(4 * Math.PI * frequency * t + phase * 1.5) +
            0.1 * Math.sin(6 * Math.PI * frequency * t + phase * 2);
        }

        WavRenderer.drawBars(canvas, ctx, data, "currentColor", 12, 2, 1, true);
      }

      // Update time more slowly
      timeRef.current += 1 / 120;

      // Request next frame
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [audioData]);

  return <canvas ref={canvasRef} className={className} />;
}

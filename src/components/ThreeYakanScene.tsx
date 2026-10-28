import React, { useEffect, useRef } from 'react';

/**
 * Smart Barangay E-Governance Civic Network & GIS Motion Background
 * Clean, professional interactive canvas representing connected households,
 * digital document verification nodes, and Barangay Matatag GIS telemetry.
 * Colors matched directly to the Barangay Matatag Seal (Royal Blue, Crimson Red, Gold).
 */
export const ThreeYakanScene: React.FC<{ theme?: 'light' | 'dark' }> = ({
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Logo-matched palette: Royal Blue (#1D4ED8), Crimson Red (#B91C1C), Crescent Gold (#D97706)
    const palette =
      theme === 'dark'
        ? ['#3B82F6', '#EF4444', '#F59E0B', '#10B981']
        : ['#1D4ED8', '#B91C1C', '#D97706', '#059669'];

    const nodeCount = Math.min(42, Math.floor((width * height) / 36000));
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: i % 6 === 0 ? 3.5 : 2.2,
      color: palette[i % palette.length],
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle GIS Coordinate Grid
      const gridSize = 72;
      ctx.strokeStyle =
        theme === 'dark' ? 'rgba(148, 163, 184, 0.04)' : 'rgba(30, 64, 175, 0.035)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Update & connect civic network nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.025;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 175;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (theme === 'dark' ? 0.16 : 0.11);
            ctx.strokeStyle =
              theme === 'dark'
                ? `rgba(59, 130, 246, ${alpha})`
                : `rgba(29, 78, 216, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        // Draw civic node
        ctx.fillStyle = n.color;
        ctx.globalAlpha = theme === 'dark' ? 0.45 : 0.32;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outer GIS ring on hub nodes
        if (i % 6 === 0) {
          const ringRadius = n.radius + 4 + Math.sin(n.pulse) * 2;
          ctx.strokeStyle = n.color;
          ctx.globalAlpha = theme === 'dark' ? 0.22 : 0.16;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Soft Civic Radial Wash matching Logo Blue & Crimson */}
      <div
        className={`absolute inset-0 transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-[radial-gradient(circle_at_15%_15%,rgba(29,78,216,0.12),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(185,28,28,0.10),transparent_45%),linear-gradient(180deg,#0B1120_0%,#0F172A_100%)]'
            : 'bg-[radial-gradient(circle_at_15%_10%,rgba(29,78,216,0.06),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(185,28,28,0.05),transparent_45%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)]'
        }`}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

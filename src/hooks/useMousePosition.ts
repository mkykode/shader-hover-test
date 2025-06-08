import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
  isHovering: boolean;
}

export const useMousePosition = (targetRef: React.RefObject<HTMLElement | null>) => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
    isHovering: false,
  });

  const mouseRef = useRef({ x: 0, y: 0 });
  const hoverRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Store raw coordinates
      mouseRef.current.x = x;
      mouseRef.current.y = y;

      // Update state with normalized coordinates
      setMousePosition(prev => ({
        ...prev,
        x,
        y,
        normalizedX: x / rect.width,
        normalizedY: 1.0 - (y / rect.height), // Flip Y for shader coordinates
      }));
    };

    const handleMouseEnter = () => {
      setMousePosition(prev => ({ ...prev, isHovering: true }));
      
      // Animate hover value using GSAP
      gsap.to(hoverRef, {
        current: 1,
        duration: 1,
        ease: 'power3.inOut',
      });
    };

    const handleMouseLeave = () => {
      setMousePosition(prev => ({ ...prev, isHovering: false }));
      
      // Animate hover value using GSAP
      gsap.to(hoverRef, {
        current: 0,
        duration: 1,
        ease: 'power3.inOut',
      });
    };

    // Add event listeners
    target.addEventListener('mousemove', handleMouseMove);
    target.addEventListener('mouseenter', handleMouseEnter);
    target.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup function
    return () => {
      target.removeEventListener('mousemove', handleMouseMove);
      target.removeEventListener('mouseenter', handleMouseEnter);
      target.removeEventListener('mouseleave', handleMouseLeave);
      
      const currentFrame = animationFrameRef.current;
      if (currentFrame) {
        cancelAnimationFrame(currentFrame);
      }
    };
  }, [targetRef]);

  // Return mouse position and hover intensity
  return {
    ...mousePosition,
    hoverIntensity: hoverRef.current,
    mouseRef,
    hoverRef,
  };
};
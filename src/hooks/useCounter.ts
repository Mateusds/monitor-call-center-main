import { useState, useEffect, useRef } from 'react';

interface UseCounterProps {
  end: number;
  duration?: number;
  start?: number;
  key?: string; // Chave para reiniciar animação
}

export function useCounter({ end, duration = 2000, start = 0, key }: UseCounterProps) {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (end === start) {
      setCount(end);
      return;
    }

    setIsAnimating(true);
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentCount = Math.floor(start + (end - start) * easeOutQuart);
      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, start, key]); // Adicionar key às dependências

  return { count, isAnimating };
}

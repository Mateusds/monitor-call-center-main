import React, { useEffect, useState } from 'react';

interface CounterProps {
    value: number;
    duration?: number;
    formatter?: (value: number) => string;
}

export function Counter({ value, duration = 1000, formatter = (v) => v.toLocaleString('pt-BR') }: CounterProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const startValue = displayValue;
        const endValue = value;

        // Se o valor for o mesmo, não anima
        if (startValue === endValue) return;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function: easeOutQuart
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * (endValue - startValue) + startValue);

            setDisplayValue(current);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setDisplayValue(endValue);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <>{formatter(displayValue)}</>;
}

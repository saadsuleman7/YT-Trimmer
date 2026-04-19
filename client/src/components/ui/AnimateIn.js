import { useRef, useState, useEffect } from 'react';

const animations = {
  'fade-up': 'opacity-0 translate-y-8',
  'fade-down': 'opacity-0 -translate-y-8',
  'fade-left': 'opacity-0 translate-x-8',
  'fade-right': 'opacity-0 -translate-x-8',
  'scale': 'opacity-0 scale-90',
  'fade': 'opacity-0',
};

const AnimateIn = ({ children, type = 'fade-up', delay = 0, duration = 700, className = '', once = true }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${visible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : animations[type]} ${className}`}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimateIn;

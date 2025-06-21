import { createFileRoute } from '@tanstack/react-router'
import { HomeHero } from '~/components/home/HomeHero'
import { GettingStarted } from '~/components/home/GettingStarted'
import { useRef, useEffect, useState } from "react";

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      <section className="snap-start min-h-screen">
        <HomeHero />
      </section>
      <section className="snap-start bg-white" id="getting-started">
        <GettingStarted />
      </section>
    </div>
  )
}



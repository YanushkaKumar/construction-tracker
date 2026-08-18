'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, ArrowRight, ArrowDown, ArrowUpRight, ChevronRight, ChevronLeft, ChevronDown,
  Menu, X, Star, Mail, Phone, Images, Plus,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Brand steel-blue, sampled from the IN Builders logo mark.
const STEEL = '#2f6fa8';

// ── Scroll reveal ─────────────────────────────────────────────

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -70px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-[800ms] ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Animated counter ─────────────────────────────────────────

function Counter({ to, padTo2 = false }: { to: number; padTo2?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setValue(to);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const started = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - started) / 1500, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(to * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return <span ref={ref}>{padTo2 ? pad(value) : value}</span>;
}

// ── Scroll progress ──────────────────────────────────────────

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[3px] bg-transparent pointer-events-none" aria-hidden>
      <div
        className="h-full origin-left transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})`, background: STEEL }}
      />
    </div>
  );
}

// ── Custom cursor (pointer-fine devices only) ──────────────────

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || prefersReducedMotion()) return;
    setEnabled(true);

    let ringX = 0;
    let ringY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      }
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest('a, button, summary, [role="button"]')));
    };

    const tick = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none hidden md:block" aria-hidden>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-white transition-transform duration-75 ease-out"
      />
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full border transition-[width,height,border-color,background-color] duration-200 ease-out ${
          hovering ? 'w-12 h-12 bg-white/10' : 'w-7 h-7 bg-transparent'
        }`}
        style={{ borderColor: hovering ? '#fff' : `${STEEL}` }}
      />
    </div>
  );
}

// ── Magnetic wrapper for CTAs ──────────────────────────────────

function Magnetic({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = 'translate(0, 0)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '#work',     id: 'work',     label: 'Work' },
  { href: '#about',    id: 'about',    label: 'About' },
  { href: '#services', id: 'services', label: 'Services' },
  { href: '#contact',  id: 'contact',  label: 'Contact' },
];

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_LINKS
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled || open ? 'bg-black/92 backdrop-blur-xl border-b border-white/10' : 'bg-gradient-to-b from-black/60 to-transparent'
      }`}
      role="banner"
    >
      <div className="max-w-[1700px] mx-auto flex h-[64px] sm:h-[76px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4"
          aria-label="IN Builders — home"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 overflow-hidden bg-white flex-shrink-0">
            <Image src="/images/logo.png" alt="" fill className="object-contain p-0.5" sizes="36px" />
          </div>
          <span className="font-display text-[15px] sm:text-[17px] font-semibold tracking-[0.02em] uppercase text-white">
            IN Builders
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={active === l.id ? 'true' : undefined}
              className={`relative flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase py-1.5 transition-colors duration-300 ${
                active === l.id ? 'text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <span className="font-mono text-[9px]" style={{ color: active === l.id ? STEEL : undefined }}>
                {pad(i + 1)}
              </span>
              {l.label}
              <span
                className={`absolute left-0 -bottom-0.5 h-[2px] transition-all duration-300 ${
                  active === l.id ? 'w-full' : 'w-0'
                }`}
                style={{ background: STEEL }}
                aria-hidden
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+94763667924"
            className="hidden lg:inline-flex items-center gap-2 text-[12.5px] font-bold text-white/75 hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden />
            076 366 7924
          </a>
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center h-9 px-4 border border-white/30 text-white text-[10.5px] font-bold tracking-[0.14em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
          >
            Team Login
          </Link>
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 text-white"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 px-5 pt-3 pb-6 bg-black/95">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 font-display text-[24px] font-semibold tracking-[0.01em] uppercase text-white/85 hover:text-white transition-colors py-2"
            >
              <span className="font-mono text-[11px]" style={{ color: STEEL }}>{pad(i + 1)}</span>
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-white/55"
          >
            Team Login
            <ChevronRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </div>
      )}
    </header>
  );
}

// ── Data ──────────────────────────────────────────────────────

const SERVICES = [
  { title: 'Residential construction',        description: 'New home builds from foundation to roof, tailored to your land, budget, and timeline.' },
  { title: 'Renovations & interior fit-outs', description: 'Kitchen upgrades, interior remodels, and commercial fit-outs finished to a high standard.' },
  { title: 'Roofing & structural work',       description: 'Roof framing, re-roofing, and structural repairs built to hold up through the monsoon.' },
  { title: 'Boundary walls & gatehouses',     description: 'Perimeter walls, security gates, and guardhouses for homes, estates, and factories.' },
  { title: 'Concrete & driveways',            description: 'Access roads, driveways, and drainage channels finished to a smooth, durable pour.' },
  { title: 'Site supervision',                description: 'Dedicated on-site oversight from groundbreaking through to final handover, island-wide.' },
];

function imgs(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => `/images/projects/${prefix}-${i + 1}.jpg`);
}

const PROJECTS = [
  {
    title: 'Private residence',
    subtitle: 'Full construction',
    year: 'Kandy District',
    location: 'Gelioya',
    description: 'Ground-up construction of a family home — from the groundbreaking ceremony through foundation, column casting, and roof framing.',
    tags: ['Foundation', 'Structural framing', 'Roofing'],
    cover: '/images/projects/villa-10.jpg',
    video: '/videos/villa.mp4',
    images: imgs('villa', 15),
  },
  {
    title: 'Home renovation',
    subtitle: 'Kitchen rebuild',
    year: 'Kandy District',
    location: 'Gampola',
    description: 'Full interior renovation of an older residence, including a complete modern kitchen rebuild with granite countertops and tiling.',
    tags: ['Renovation', 'Kitchen fit-out', 'Tiling'],
    cover: '/images/projects/residence-1.jpg',
    video: '/videos/residence.mp4',
    images: imgs('residence', 10),
  },
  {
    title: 'Community school',
    subtitle: 'Roof restoration',
    year: 'Kandy District',
    location: 'Hanguranketa',
    description: 'Roof restoration and wall repairs for a rural school building, completed ahead of the school term.',
    tags: ['Roofing', 'Wall repairs'],
    cover: '/images/projects/school-1.jpg',
    video: '/videos/school.mp4',
    images: imgs('school', 9),
  },
  {
    title: 'Factory perimeter wall',
    subtitle: '& gatehouse',
    year: 'Industrial zone',
    location: 'Biyagama',
    description: 'Boundary wall construction and a new security gatehouse for a commercial facility.',
    tags: ['Boundary wall', 'Gatehouse', 'Commercial'],
    cover: '/images/projects/factory-1.jpg',
    video: '/videos/factory.mp4',
    images: imgs('factory', 8),
  },
  {
    title: 'Bookshop fit-out',
    subtitle: 'Retail interior',
    year: 'Kandy District',
    location: 'Kandy City',
    description: 'Steel ceiling grid and shelving installation for a busy retail bookstore, completed with minimal disruption to trading.',
    tags: ['Interior fit-out', 'Commercial'],
    cover: '/images/projects/bookhouse-1.jpg',
    video: '/videos/bookhouse.mp4',
    images: imgs('bookhouse', 5),
  },
  {
    title: 'Estate access road',
    subtitle: '& drainage',
    year: 'Kandy District',
    location: 'Katugastota',
    description: 'Concrete paving and drainage channel works for a private access road.',
    tags: ['Concrete', 'Drainage'],
    cover: '/images/projects/road-1.jpg',
    video: '/videos/road.mp4',
    images: imgs('road', 5),
  },
];

type Project = (typeof PROJECTS)[number];

/** A wall of real site photos pulled from across every project. */
const MOSAIC: { src: string; project: number; cls: string }[] = [
  { src: '/images/projects/villa-5.jpg',      project: 0, cls: 'lg:col-span-2 lg:row-span-2' },
  { src: '/images/projects/residence-1.jpg',  project: 1, cls: '' },
  { src: '/images/projects/school-1.jpg',     project: 2, cls: '' },
  { src: '/images/projects/factory-1.jpg',    project: 3, cls: '' },
  { src: '/images/projects/villa-13.jpg',     project: 0, cls: 'lg:col-span-2 lg:row-span-2' },
  { src: '/images/projects/bookhouse-1.jpg',  project: 4, cls: '' },
  { src: '/images/projects/road-1.jpg',       project: 5, cls: '' },
  { src: '/images/projects/villa-10.jpg',     project: 0, cls: 'lg:col-span-2' },
  { src: '/images/projects/residence-4.jpg',  project: 1, cls: '' },
  { src: '/images/projects/school-4.jpg',     project: 2, cls: '' },
  { src: '/images/projects/villa-8.jpg',      project: 0, cls: '' },
  { src: '/images/projects/factory-3.jpg',    project: 3, cls: 'lg:col-span-2' },
  { src: '/images/projects/residence-7.jpg',  project: 1, cls: '' },
  { src: '/images/projects/bookhouse-3.jpg',  project: 4, cls: '' },
  { src: '/images/projects/road-3.jpg',       project: 5, cls: '' },
  { src: '/images/projects/villa-3.jpg',      project: 0, cls: '' },
];

const REVIEWS = [
  { name: 'Nimal Perera',           location: 'Gelioya',      rating: 5, quote: 'IN Builders built our house from the ground up. They were on site every day and kept us updated at every stage. Couldn’t be happier with the result.' },
  { name: 'Chamari Wickramasinghe', location: 'Gampola',      rating: 5, quote: 'Our kitchen renovation looks incredible. The team was clean, punctual, and the finish is exactly what we asked for.' },
  { name: 'Ruwan Bandara',          location: 'Biyagama',     rating: 5, quote: 'We hired IN Builders for our factory boundary wall and gatehouse. Professional crew, good safety practices, finished on schedule.' },
  { name: 'Malini Fernando',        location: 'Kandy',        rating: 4, quote: 'They fitted out our bookshop’s ceiling and shelving fast so we barely lost any trading time. Very tidy work.' },
  { name: 'Sunil Rathnayake',       location: 'Hanguranketa', rating: 5, quote: 'Re-roofed our school building before the monsoon. Fair pricing and honest communication throughout.' },
  { name: 'Priyantha Jayasuriya',   location: 'Katugastota',  rating: 5, quote: 'Solid concrete work on our access road — no cracks, proper drainage, still holding up years later.' },
];

const PRINCIPLES = [
  { title: 'Island-wide reach',     description: 'Based in the Kandy District, taking on jobs anywhere in Sri Lanka.' },
  { title: 'Standards we sign off', description: 'Every job site-supervised — nothing subcontracted out of sight.' },
  { title: 'One accountable crew',  description: 'The same team from groundbreaking to handover, every time.' },
];

const PROCESS = [
  { step: '01', title: 'Site visit & consultation',  description: 'We walk the site with you, talk through what you need, and understand the land, access, and budget before anything is priced.' },
  { step: '02', title: 'Quotation & planning',       description: 'A clear, itemised quote — materials, labour, and timeline — so there are no surprises once work starts.' },
  { step: '03', title: 'Construction & supervision', description: 'Work begins on the agreed schedule, with the same crew on site every day and progress you can check in on.' },
  { step: '04', title: 'Handover & support',         description: 'A final walkthrough before handover, and we stay reachable after the job is done — not gone the day the invoice is paid.' },
];

const FAQS = [
  { q: 'Do you supply materials, or just labour?', a: 'Both. We source and supply materials as part of the job, or work with materials you’ve already bought — whichever suits your budget and preferences.' },
  { q: 'Do you only work in the Kandy District?', a: 'Kandy is where we’re based, but we take on projects island-wide. Distance just gets factored into the quotation.' },
  { q: 'How does pricing and quotation work?', a: 'After a site visit, you get an itemised quote covering materials, labour, and an expected timeline — before any work or payment starts.' },
  { q: 'Can I visit the site while work is in progress?', a: 'Yes — every project is site-supervised, and you’re welcome to check in on progress whenever you like.' },
  { q: 'What size of job do you take on?', a: 'Anything from a single boundary wall or interior fit-out to a full house build or commercial site — the crew and timeline scale to the job.' },
  { q: 'What happens after handover?', a: 'We do a final walkthrough with you before handover, and stay reachable afterwards if anything needs following up.' },
];

// ── Small pieces ─────────────────────────────────────────────

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          style={i < rating ? { color: STEEL, fill: STEEL } : undefined}
          aria-hidden
        />
      ))}
    </div>
  );
}

function Eyebrow({ children, tone = 'dark' }: { children: React.ReactNode; tone?: 'dark' | 'light' }) {
  return (
    <p
      className={`flex items-center gap-3 font-mono text-[10.5px] font-bold tracking-[0.22em] uppercase mb-6 ${
        tone === 'dark' ? 'text-white/55' : 'text-black/50'
      }`}
    >
      <span className="inline-block w-7 h-[2px]" style={{ background: STEEL }} aria-hidden />
      {children}
    </p>
  );
}

/** Small L-shaped corner marks — a blueprint / spec-sheet framing cue. */
function CornerFrame({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const c = tone === 'light' ? 'border-white/40' : 'border-black/25';
  const base = 'absolute w-6 h-6 sm:w-8 sm:h-8';
  return (
    <div className="absolute inset-4 sm:inset-6 lg:inset-8 pointer-events-none" aria-hidden>
      <span className={`${base} top-0 left-0 border-t-2 border-l-2 ${c}`} />
      <span className={`${base} top-0 right-0 border-t-2 border-r-2 ${c}`} />
      <span className={`${base} bottom-0 left-0 border-b-2 border-l-2 ${c}`} />
      <span className={`${base} bottom-0 right-0 border-b-2 border-r-2 ${c}`} />
    </div>
  );
}

// ── Project gallery modal (grid + full-screen viewer) ─────────

function ProjectGalleryModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    setViewerIndex(null);
  }, [project]);

  useEffect(() => {
    if (viewerIndex === null || !project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerIndex(null);
      if (e.key === 'ArrowRight') setViewerIndex((i) => (i === null ? i : (i + 1) % project.images.length));
      if (e.key === 'ArrowLeft') setViewerIndex((i) => (i === null ? i : (i - 1 + project.images.length) % project.images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIndex, project]);

  if (!project) return null;

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={viewerIndex === null}
        className="max-w-5xl w-full max-h-[90vh] p-0 gap-0 overflow-hidden rounded-none bg-white border-black/10 text-black"
      >
        {viewerIndex === null ? (
          <div className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 sm:p-8 pb-5 border-b border-black/10 flex-shrink-0">
              <DialogTitle className="font-display text-[26px] sm:text-[32px] font-semibold uppercase tracking-[0.01em] leading-[1.05] text-black">
                {project.title}
                <span className="block" style={{ color: STEEL }}>{project.subtitle}</span>
              </DialogTitle>
              <DialogDescription>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold tracking-[0.14em] uppercase text-black/50 mt-3">
                  <MapPin className="w-3.5 h-3.5" aria-hidden />
                  {project.location}, {project.year}
                </span>
                <span className="block mt-3 text-[14px] text-black/60 leading-relaxed max-w-2xl">
                  {project.description}
                </span>
                <span className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 border border-black/15 font-mono text-[9.5px] font-bold tracking-[0.1em] uppercase text-black/55">
                      {t}
                    </span>
                  ))}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto scrollbar-thin p-4 sm:p-6 bg-neutral-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {project.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setViewerIndex(i)}
                    className="relative aspect-[4/3] overflow-hidden group bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    aria-label={`View photo ${i + 1} of ${project.images.length}`}
                  >
                    <Image src={img} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="280px" />
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" aria-hidden />
                    <span className="absolute bottom-2 right-2 font-mono text-[10px] font-bold tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {pad(i + 1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-[90vh] bg-black flex items-center justify-center">
            <button
              onClick={() => setViewerIndex(null)}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
              aria-label="Close photo viewer"
            >
              <X className="w-4.5 h-4.5" aria-hidden />
            </button>
            <button
              onClick={() => setViewerIndex((i) => (i! - 1 + project.images.length) % project.images.length)}
              className="absolute left-3 sm:left-5 z-10 flex items-center justify-center w-11 h-11 bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>
            <div className="relative w-full h-full">
              <Image
                key={project.images[viewerIndex]}
                src={project.images[viewerIndex]}
                alt={`${project.title} — photo ${viewerIndex + 1}`}
                fill
                className="object-contain animate-fade-in"
                sizes="100vw"
              />
            </div>
            <button
              onClick={() => setViewerIndex((i) => (i! + 1) % project.images.length)}
              className="absolute right-3 sm:right-5 z-10 flex items-center justify-center w-11 h-11 bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[12px] font-bold tracking-[0.2em] text-white/80 tabular-nums">
              {pad(viewerIndex + 1)} / {pad(project.images.length)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Mounts its video only once scrolled near — keeps mobile from autoplaying six clips at once. */
function LazyProjectMedia({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      {project.video && inView ? (
        <video
          src={project.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={project.cover}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <Image src={project.cover} alt="" fill className="object-cover" sizes="100vw" />
      )}
    </div>
  );
}

// ── Work: interactive index with live video/photo preview ─────

function WorkIndex({ onOpen }: { onOpen: (p: Project) => void }) {
  const [active, setActive] = useState(0);
  const current = PROJECTS[active];
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  // Only the visible preview should actually decode/play — the rest stay paused
  // even though they're mounted underneath (opacity 0) for the crossfade.
  useEffect(() => {
    PROJECTS.forEach((p, i) => {
      const el = videoRefs.current[i];
      if (!el || !p.video) return;
      if (i === active) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [active]);

  return (
    <div className="relative bg-black text-white px-5 sm:px-8 lg:px-12 py-16 sm:py-24">
      <div className="absolute inset-0 grain opacity-[0.04] mix-blend-overlay pointer-events-none" aria-hidden />
      <div className="relative max-w-[1700px] mx-auto">
        {/* Desktop — index left, live preview right */}
        <div className="hidden lg:grid grid-cols-[1fr_0.8fr] gap-16 xl:gap-24 items-start">
          <div className="border-t border-white/15">
            {PROJECTS.map((p, i) => (
              <button
                key={p.title}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => onOpen(p)}
                aria-label={`View gallery — ${p.title}, ${p.subtitle}`}
                className="group w-full text-left border-b border-white/15 py-6 flex items-center gap-8 transition-colors duration-300 focus:outline-none focus-visible:bg-white/10"
              >
                <span
                  className="font-mono text-[11px] font-bold tracking-[0.2em] tabular-nums transition-colors duration-300"
                  style={{ color: active === i ? STEEL : 'rgba(255,255,255,0.28)' }}
                >
                  {pad(i + 1)}
                </span>

                <span className="flex-1 min-w-0">
                  <span
                    className={`block font-display text-[30px] xl:text-[38px] font-semibold uppercase tracking-[0.005em] leading-[1.05] transition-colors duration-300 ${
                      active === i ? 'text-white' : 'text-white/35'
                    }`}
                  >
                    {p.title} <span className="font-normal normal-case text-white/50">{p.subtitle}</span>
                  </span>
                  <span
                    className={`flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.05em] uppercase mt-2 transition-colors duration-300 ${
                      active === i ? 'text-white/60' : 'text-white/25'
                    }`}
                  >
                    {p.location}, {p.year} · {p.images.length} photos
                    {p.video && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 border text-[9.5px] font-bold"
                        style={{
                          borderColor: active === i ? STEEL : 'rgba(255,255,255,0.2)',
                          color: active === i ? STEEL : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        VIDEO
                      </span>
                    )}
                  </span>
                </span>

                <ArrowUpRight
                  className={`w-6 h-6 flex-shrink-0 transition-all duration-300 ${
                    active === i
                      ? 'opacity-100 translate-x-0 translate-y-0'
                      : 'opacity-0 -translate-x-2 translate-y-2'
                  }`}
                  aria-hidden
                />
              </button>
            ))}
          </div>

          {/* Live preview — video where available, photo otherwise */}
          <div className="sticky top-28">
            <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
              {PROJECTS.map((p, i) => (
                <div
                  key={p.title}
                  className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                    active === i ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {p.video ? (
                    <video
                      ref={(el) => { videoRefs.current[i] = el; }}
                      src={p.video}
                      muted
                      loop
                      playsInline
                      autoPlay={i === active}
                      preload={i === active ? 'auto' : 'none'}
                      poster={p.cover}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Image src={p.cover} alt="" fill className="object-cover" sizes="640px" />
                  )}
                </div>
              ))}
              <CornerFrame tone="light" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-mono text-[11px] font-bold tracking-[0.18em] uppercase text-white/70 mb-1.5">
                  {pad(active + 1)} / {pad(PROJECTS.length)} — {current.location}
                </p>
                <p className="font-display text-[22px] font-semibold uppercase tracking-[0.01em] leading-tight">
                  {current.title}
                </p>
              </div>
            </div>
            <p className="text-[13.5px] text-white/55 leading-relaxed mt-5">
              {current.description}
            </p>
          </div>
        </div>

        {/* Mobile — stacked cards, muted autoplay video where available */}
        <div className="lg:hidden space-y-10">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.title}>
              <button
                onClick={() => onOpen(p)}
                aria-label={`View gallery — ${p.title}, ${p.subtitle}`}
                className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900 mb-4">
                  <LazyProjectMedia project={p} />
                  <span className="absolute top-3 left-3 font-mono text-[11px] font-bold tracking-[0.2em] text-white/80">
                    {pad(i + 1)} / {pad(PROJECTS.length)}
                  </span>
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[10.5px] font-bold tracking-[0.12em] uppercase">
                    <Images className="w-3.5 h-3.5" aria-hidden />
                    {p.images.length} photos
                  </span>
                </div>
                <p className="font-display text-[24px] font-semibold uppercase tracking-[0.005em] leading-[1.1]">
                  {p.title} <span className="font-normal normal-case text-white/50">{p.subtitle}</span>
                </p>
                <p className="font-mono text-[11px] font-medium tracking-[0.05em] uppercase text-white/40 mt-2">
                  {p.location}, {p.year}
                </p>
                <p className="text-[13.5px] text-white/60 leading-relaxed mt-3">{p.description}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Work: photo wall ─────────────────────────────────────────

function PhotoWall({ onOpen }: { onOpen: (p: Project) => void }) {
  return (
    <div className="bg-white text-black px-5 sm:px-8 lg:px-12 py-20 sm:py-28">
      <div className="max-w-[1700px] mx-auto">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
            <div>
              <Eyebrow tone="light">Straight from site</Eyebrow>
              <h3 className="font-display text-[7vw] sm:text-[3.8vw] lg:text-[2.7vw] font-semibold uppercase tracking-[0.005em] leading-[1.08] max-w-2xl">
                Fifty-two photographs. <span style={{ color: STEEL }}>No stock imagery.</span>
              </h3>
            </div>
            <p className="text-[13.5px] text-black/55 leading-relaxed max-w-xs">
              Every picture on this page was taken on one of our own sites. Tap any frame to open
              that project&apos;s full set.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 auto-rows-[120px] sm:auto-rows-[150px] lg:auto-rows-[175px] gap-2 sm:gap-3">
          {MOSAIC.map((tile, i) => {
            const project = PROJECTS[tile.project];
            return (
              <Reveal key={tile.src + i} delay={Math.min(i, 8) * 45} className={tile.cls}>
                <button
                  onClick={() => onOpen(project)}
                  aria-label={`View gallery — ${project.title}, ${project.subtitle}`}
                  className="group relative block w-full h-full overflow-hidden bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <Image
                    src={tile.src}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 25vw, 50vw"
                  />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors duration-400" aria-hidden />
                  <span className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                    <span className="block text-[11px] font-semibold text-white leading-tight">
                      {project.title}
                    </span>
                    <span className="block text-[10px] text-white/70 mt-0.5">
                      {project.location} · {project.images.length} photos
                    </span>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main landing page ─────────────────────────────────────────

export default function HomeClient() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-white text-black font-sans antialiased selection:bg-black selection:text-white">
      <ScrollProgress />
      <CustomCursor />
      <Nav />

      {/* ── 1. Opening frame — video hero ──────────────────── */}
      <section className="relative min-h-[100svh] w-full overflow-hidden bg-black" aria-label="IN Builders">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/hero-roofing.jpg"
          className="absolute inset-0 w-full h-full object-cover animate-[heroscale_24s_ease-in-out_infinite]"
        >
          <source src="/videos/villa.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/60" aria-hidden />
        <div className="absolute inset-0 grain opacity-[0.05] mix-blend-overlay pointer-events-none" aria-hidden />
        <CornerFrame tone="light" />

        {/* Scroll cue */}
        <div
          className="hidden lg:flex absolute right-8 xl:right-12 top-1/2 -translate-y-1/2 flex-col items-center gap-3 text-white/45"
          aria-hidden
        >
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase [writing-mode:vertical-rl]">
            Scroll
          </span>
          <span className="relative w-px h-12 bg-white/20 overflow-hidden">
            <span
              className="absolute inset-x-0 top-0 h-3"
              style={{ background: STEEL, animation: 'scrolldot 2s ease-in-out infinite' }}
            />
          </span>
        </div>

        <div className="relative min-h-[100svh] flex flex-col justify-end px-5 sm:px-8 lg:px-12 pb-12 sm:pb-16">
          <div className="max-w-[1700px] mx-auto w-full">
            <Eyebrow>Building contractors — Sri Lanka</Eyebrow>

            <h1 className="font-display text-[13vw] sm:text-[9vw] lg:text-[7vw] font-semibold uppercase tracking-[0.005em] leading-[0.98] text-white mb-8 sm:mb-10">
              We build it <span style={{ color: STEEL }}>right.</span>
            </h1>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-t border-white/15 pt-8">
              <p className="text-[15px] sm:text-[16.5px] text-white/70 leading-relaxed max-w-md">
                A Sri Lankan construction company delivering homes, renovations, roofing,
                boundary walls, and commercial fit-outs — built on site, on schedule,
                and done properly.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Magnetic>
                  <a
                    href="#work"
                    className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-white text-black text-[11px] font-bold tracking-[0.16em] uppercase hover:bg-white/90 transition-colors duration-300"
                  >
                    See the work
                    <ArrowDown className="w-4 h-4" aria-hidden />
                  </a>
                </Magnetic>
                <Magnetic>
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center gap-3 h-14 px-8 border border-white/35 text-white text-[11px] font-bold tracking-[0.16em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
                  >
                    Get a quote
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </a>
                </Magnetic>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hazard-style thin divider */}
      <div
        className="h-2 w-full"
        style={{
          background: `repeating-linear-gradient(-45deg, ${STEEL} 0 14px, #000 14px 28px)`,
        }}
        aria-hidden
      />

      {/* ── 2. Statement ──────────────────────────────────── */}
      <section
        id="about"
        className="scroll-mt-20 w-full bg-white text-black px-5 sm:px-8 lg:px-12 py-24 sm:py-36"
        aria-labelledby="about-heading"
      >
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <Eyebrow tone="light">Who we are</Eyebrow>
            <h2
              id="about-heading"
              className="font-display text-[7.5vw] sm:text-[5vw] lg:text-[3.4vw] font-semibold uppercase tracking-[0.005em] leading-[1.08] max-w-4xl mb-16 sm:mb-20"
            >
              A hands-on building crew, <span style={{ color: STEEL }}>not a call centre.</span>
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-start">
            <Reveal delay={80}>
              <div className="space-y-5 text-[15px] sm:text-[16.5px] leading-relaxed text-black/65 max-w-xl">
                <p>
                  IN Builders takes on residential construction, renovations, roofing, boundary
                  walls, and commercial fit-outs — based in the Kandy District, and equipped to
                  take on work anywhere on the island. Every project is site-supervised from
                  groundbreaking to handover, with no subcontracted guesswork.
                </p>
                <p>
                  Whether it&apos;s a new family home, a kitchen rebuild, or a factory perimeter
                  wall, we plan the job properly, show up on schedule, and finish it to a
                  standard we&apos;d put our own name on.
                </p>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="border-t border-black/15">
                {PRINCIPLES.map((p, i) => (
                  <div
                    key={p.title}
                    className="group flex gap-6 sm:gap-10 py-6 border-b border-black/15 transition-colors duration-300 hover:bg-black/[0.03]"
                  >
                    <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-black/25 tabular-nums pt-2">
                      {pad(i + 1)}
                    </span>
                    <div>
                      <h3 className="font-display text-[19px] sm:text-[21px] font-semibold uppercase tracking-[0.005em] mb-1.5">
                        {p.title}
                      </h3>
                      <p className="text-[14px] text-black/55 leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 3. Work — index + photo wall ──────────────────── */}
      <section id="work" className="scroll-mt-20 w-full" aria-labelledby="work-heading">
        <div className="bg-black text-white px-5 sm:px-8 lg:px-12 pt-20 sm:pt-28">
          <div className="max-w-[1700px] mx-auto">
            <Reveal>
              <Eyebrow>Selected work — {pad(PROJECTS.length)} projects</Eyebrow>
              <h2
                id="work-heading"
                className="font-display text-[8.5vw] sm:text-[5.5vw] lg:text-[3.8vw] font-semibold uppercase tracking-[0.005em] leading-[1.05] max-w-3xl"
              >
                Built on the ground, <span style={{ color: STEEL }}>across the island.</span>
              </h2>
            </Reveal>
          </div>
        </div>

        <WorkIndex onOpen={setActiveProject} />
        <PhotoWall onOpen={setActiveProject} />
      </section>

      {/* ── 4. Numbers — dimension-line ruled stats ───────── */}
      <section className="relative w-full overflow-hidden bg-black" aria-label="By the numbers">
        <Image
          src="/images/projects/villa-5.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/78" aria-hidden />
        <div className="absolute inset-0 grain opacity-[0.05] mix-blend-overlay pointer-events-none" aria-hidden />

        <div className="relative px-5 sm:px-8 lg:px-12 py-20 sm:py-28 max-w-[1700px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {[
              { node: <Counter to={6} padTo2 />,  label: 'Projects showcased' },
              { node: <Counter to={52} />,        label: 'Site photos on file' },
              { node: <><Counter to={100} />%</>, label: 'Site-supervised' },
              { node: 'Island',                   label: 'Wide service coverage' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className="relative pl-4">
                  <span className="absolute left-0 top-0 bottom-0 w-px bg-white/20" aria-hidden />
                  <span className="absolute left-0 top-0 w-2.5 h-px" style={{ background: STEEL }} aria-hidden />
                  <span className="absolute left-0 bottom-0 w-2.5 h-px" style={{ background: STEEL }} aria-hidden />
                  <p className="font-display text-[13vw] sm:text-[7vw] lg:text-[4.4vw] font-semibold tracking-[0em] leading-[0.9] text-white tabular-nums">
                    {s.node}
                  </p>
                  <p className="font-mono text-[10.5px] font-bold tracking-[0.16em] uppercase text-white/55 mt-4 pt-4 border-t border-white/20">
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Capabilities ───────────────────────────────── */}
      <section
        id="services"
        className="scroll-mt-20 w-full bg-white text-black px-5 sm:px-8 lg:px-12 py-24 sm:py-36"
        aria-labelledby="services-heading"
      >
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <Eyebrow tone="light">Capabilities</Eyebrow>
            <h2
              id="services-heading"
              className="font-display text-[8vw] sm:text-[5.5vw] lg:text-[3.4vw] font-semibold uppercase tracking-[0.005em] leading-[1.06] max-w-3xl mb-14 sm:mb-20"
            >
              From a single wall <span style={{ color: STEEL }}>to a whole house.</span>
            </h2>
          </Reveal>

          <div className="border-t border-black/15">
            {SERVICES.map((s, i) => (
              <Reveal key={s.title} delay={i * 55}>
                <div className="group grid sm:grid-cols-[auto_1fr_1.1fr] items-baseline gap-x-6 sm:gap-x-10 gap-y-2 py-7 sm:py-8 border-b border-black/15 transition-colors duration-300 hover:bg-black/[0.03]">
                  <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-black/30 tabular-nums">
                    {pad(i + 1)}
                  </span>
                  <h3 className="font-display text-[24px] sm:text-[28px] lg:text-[32px] font-semibold uppercase tracking-[0.005em] leading-[1.08] text-black/85 group-hover:text-black transition-colors duration-300">
                    {s.title}
                  </h3>
                  <p className="text-[14px] text-black/55 leading-relaxed max-w-md">
                    {s.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Process ────────────────────────────────────── */}
      <section className="w-full bg-neutral-100 text-black px-5 sm:px-8 lg:px-12 py-24 sm:py-36" aria-labelledby="process-heading">
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <Eyebrow tone="light">How it runs</Eyebrow>
            <h2
              id="process-heading"
              className="font-display text-[8vw] sm:text-[5.5vw] lg:text-[3.4vw] font-semibold uppercase tracking-[0.005em] leading-[1.06] max-w-3xl mb-16 sm:mb-24"
            >
              Four steps, <span style={{ color: STEEL }}>no surprises.</span>
            </h2>
          </Reveal>

          <div className="relative">
            <span className="hidden sm:block absolute top-0 left-0 right-0 h-px bg-black/15" aria-hidden />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {PROCESS.map((p, i) => (
                <Reveal key={p.step} delay={i * 90}>
                  <div className="group relative border-t-2 border-black sm:border-t-0 pt-6 sm:pt-8">
                    <span
                      className="hidden sm:block absolute -top-[7px] left-0 w-[3px] h-[13px]"
                      style={{ background: STEEL }}
                      aria-hidden
                    />
                    <p
                      className="font-display text-[10vw] sm:text-[5vw] lg:text-[3vw] font-semibold tracking-[0em] leading-[0.9] mb-4 tabular-nums text-black/12 transition-colors duration-500 group-hover:text-black/20"
                    >
                      {p.step}
                    </p>
                    <h3 className="font-display text-[19px] font-semibold uppercase tracking-[0.005em] mb-2.5">
                      {p.title}
                    </h3>
                    <p className="text-[14px] text-black/55 leading-relaxed">{p.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Reviews ────────────────────────────────────── */}
      <section
        id="reviews"
        className="scroll-mt-20 w-full bg-white text-black px-5 sm:px-8 lg:px-12 py-24 sm:py-36"
        aria-labelledby="reviews-heading"
      >
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <Eyebrow tone="light">Client feedback</Eyebrow>
            <h2 id="reviews-heading" className="sr-only">What clients say</h2>
            <blockquote className="font-display text-[6vw] sm:text-[3.8vw] lg:text-[2.5vw] font-semibold uppercase tracking-[0.005em] leading-[1.2] max-w-5xl mb-8">
              &ldquo;{REVIEWS[0].quote}&rdquo;
            </blockquote>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-16 sm:pb-20 border-b border-black/15">
              <Stars rating={REVIEWS[0].rating} />
              <p className="font-mono text-[11.5px] font-bold tracking-[0.1em] uppercase text-black/70">
                {REVIEWS[0].name}
                <span className="text-black/35"> — {REVIEWS[0].location}</span>
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 pt-14">
            {REVIEWS.slice(1).map((r, i) => (
              <Reveal key={r.name} delay={i * 70}>
                <div className="group transition-transform duration-300 hover:-translate-y-1">
                  <span
                    className="block h-0.5 w-8 mb-4 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                    style={{ background: STEEL }}
                    aria-hidden
                  />
                  <Stars rating={r.rating} className="mb-4" />
                  <p className="text-[14.5px] text-black/65 leading-relaxed mb-4">&ldquo;{r.quote}&rdquo;</p>
                  <p className="font-mono text-[10.5px] font-bold tracking-[0.1em] uppercase text-black/70">
                    {r.name}
                    <span className="text-black/35"> — {r.location}</span>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. FAQ ────────────────────────────────────────── */}
      <section className="w-full bg-neutral-100 text-black px-5 sm:px-8 lg:px-12 py-24 sm:py-36" aria-labelledby="faq-heading">
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <Eyebrow tone="light">Common questions</Eyebrow>
            <h2
              id="faq-heading"
              className="font-display text-[8vw] sm:text-[5.5vw] lg:text-[3vw] font-semibold uppercase tracking-[0.005em] leading-[1.06] max-w-3xl mb-14"
            >
              Before you <span style={{ color: STEEL }}>get a quote.</span>
            </h2>
          </Reveal>

          <div className="border-t border-black/15 max-w-4xl">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-black/15">
                <summary className="flex items-center justify-between gap-6 py-6 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-[17px] sm:text-[20px] font-semibold uppercase tracking-[0.005em] text-black/80 group-hover:text-black transition-colors">
                    {f.q}
                  </span>
                  <ChevronDown className="w-5 h-5 text-black/40 flex-shrink-0 transition-transform duration-300 group-open:rotate-180" aria-hidden />
                </summary>
                <p className="pb-6 text-[14.5px] text-black/60 leading-relaxed max-w-2xl">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Contact ────────────────────────────────────── */}
      <section
        id="contact"
        className="scroll-mt-0 relative min-h-[100svh] w-full overflow-hidden bg-black"
        aria-label="Get in touch"
      >
        <Image
          src="/images/projects/villa-13.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/74" aria-hidden />
        <div className="absolute inset-0 grain opacity-[0.05] mix-blend-overlay pointer-events-none" aria-hidden />
        <CornerFrame tone="light" />

        <div className="relative min-h-[100svh] flex flex-col justify-end px-5 sm:px-8 lg:px-12 pt-28 pb-12 sm:pb-16">
          <div className="max-w-[1700px] mx-auto w-full">
            <Reveal>
              <Eyebrow>Start a project</Eyebrow>
              <h2 className="font-display text-[11vw] sm:text-[8vw] lg:text-[5.5vw] font-semibold uppercase tracking-[0.005em] leading-[0.98] text-white mb-10 sm:mb-14">
                Let&apos;s build <span style={{ color: STEEL }}>something.</span>
              </h2>

              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-t border-white/15 pt-8">
                <p className="text-[15px] sm:text-[16.5px] text-white/70 leading-relaxed max-w-md">
                  Tell us about your project and we&apos;ll get back to you with next steps —
                  from a single wall to a full house build, anywhere on the island.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Magnetic>
                    <a
                      href="tel:+94763667924"
                      className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-white text-black text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-white/90 transition-colors duration-300"
                    >
                      <Phone className="w-4 h-4" aria-hidden />
                      076 366 7924
                    </a>
                  </Magnetic>
                  <Magnetic>
                    <a
                      href="mailto:info@inbuilders.lk"
                      className="inline-flex items-center justify-center gap-3 h-14 px-8 border border-white/35 text-white text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
                    >
                      <Mail className="w-4 h-4" aria-hidden />
                      Email us
                    </a>
                  </Magnetic>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="w-full bg-black border-t border-white/12" role="contentinfo">
        <div className="max-w-[1700px] mx-auto px-5 sm:px-8 lg:px-12 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 overflow-hidden bg-white flex-shrink-0" aria-hidden>
              <Image src="/images/logo.png" alt="" fill className="object-contain p-0.5" sizes="28px" />
            </div>
            <span className="font-display text-[14px] font-semibold uppercase tracking-[0.02em] text-white">IN Builders</span>
          </div>

          <p className="font-mono text-[11px] text-white/35">
            &copy; {new Date().getFullYear()}{' '}IN Builders — Building contractors, Sri Lanka
          </p>

          <div className="flex items-center gap-6 text-[11px] font-bold tracking-[0.12em] uppercase text-white/45">
            <a href="tel:+94763667924" className="hover:text-white transition-colors">076 366 7924</a>
            <Link href="/login" className="hover:text-white transition-colors">Team Login</Link>
          </div>
        </div>
      </footer>

      <ProjectGalleryModal project={activeProject} onClose={() => setActiveProject(null)} />
    </div>
  );
}

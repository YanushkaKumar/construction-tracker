'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, ArrowRight, ArrowDown, ChevronRight, ChevronLeft, ChevronDown, Menu, X, Star,
  Mail, Phone, Images, Plus,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

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
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-[900ms] ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#work',     label: 'Work' },
    { href: '#about',    label: 'About' },
    { href: '#services', label: 'Services' },
    { href: '#contact',  label: 'Contact' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled || open ? 'bg-black/85 backdrop-blur-xl' : 'bg-transparent'
      }`}
      role="banner"
    >
      <div className="max-w-[1700px] mx-auto flex h-[68px] sm:h-20 items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="IN Builders — home">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 overflow-hidden bg-white flex-shrink-0">
            <Image src="/images/logo.png" alt="" fill className="object-contain p-0.5" sizes="36px" />
          </div>
          <span className="text-[13px] sm:text-[15px] font-black tracking-[0.14em] uppercase text-white">
            IN Builders
          </span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-9 text-[11px] font-bold tracking-[0.18em] uppercase text-white/55"
          aria-label="Main"
        >
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white transition-colors duration-300">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+94763667924"
            className="hidden lg:inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-white/75 hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden />
            076 366 7924
          </a>
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center h-9 px-4 border border-white/25 text-white text-[10.5px] font-bold tracking-[0.16em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
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
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-[22px] font-black tracking-tight uppercase text-white/85 hover:text-white transition-colors py-2.5"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] uppercase text-white/55"
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
  { title: 'Residential Construction',      description: 'New home builds from foundation to roof, tailored to your land, budget, and timeline.' },
  { title: 'Renovations & Interior Fit-Outs', description: 'Kitchen upgrades, interior remodels, and commercial fit-outs finished to a high standard.' },
  { title: 'Roofing & Structural Work',     description: 'Roof framing, re-roofing, and structural repairs built to hold up through the monsoon.' },
  { title: 'Boundary Walls & Gatehouses',   description: 'Perimeter walls, security gates, and guardhouses for homes, estates, and factories.' },
  { title: 'Concrete & Driveways',          description: 'Access roads, driveways, and drainage channels finished to a smooth, durable pour.' },
  { title: 'Site Supervision',              description: 'Dedicated on-site oversight from groundbreaking through to final handover, island-wide.' },
];

function imgs(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => `/images/projects/${prefix}-${i + 1}.jpg`);
}

const PROJECTS = [
  {
    title: 'Private Residence',
    subtitle: 'Full Construction',
    location: 'Gelioya, Kandy District',
    description: 'Ground-up construction of a family home — from the groundbreaking ceremony through foundation, column casting, and roof framing.',
    tags: ['Foundation', 'Structural Framing', 'Roofing'],
    cover: '/images/projects/villa-10.jpg',
    images: imgs('villa', 15),
  },
  {
    title: 'Home Renovation',
    subtitle: 'Kitchen Rebuild',
    location: 'Gampola, Kandy District',
    description: 'Full interior renovation of an older residence, including a complete modern kitchen rebuild with granite countertops and tiling.',
    tags: ['Renovation', 'Kitchen Fit-Out', 'Tiling'],
    cover: '/images/projects/residence-1.jpg',
    images: imgs('residence', 10),
  },
  {
    title: 'Community School',
    subtitle: 'Roof Restoration',
    location: 'Hanguranketa, Kandy District',
    description: 'Roof restoration and wall repairs for a rural school building, completed ahead of the school term.',
    tags: ['Roofing', 'Wall Repairs'],
    cover: '/images/projects/school-1.jpg',
    images: imgs('school', 9),
  },
  {
    title: 'Factory Perimeter Wall',
    subtitle: '& Gatehouse',
    location: 'Biyagama Industrial Zone',
    description: 'Boundary wall construction and a new security gatehouse for a commercial facility.',
    tags: ['Boundary Wall', 'Gatehouse', 'Commercial'],
    cover: '/images/projects/factory-1.jpg',
    images: imgs('factory', 8),
  },
  {
    title: 'Bookshop Fit-Out',
    subtitle: 'Retail Interior',
    location: 'Kandy City',
    description: 'Steel ceiling grid and shelving installation for a busy retail bookstore, completed with minimal disruption to trading.',
    tags: ['Interior Fit-Out', 'Commercial'],
    cover: '/images/projects/bookhouse-1.jpg',
    images: imgs('bookhouse', 5),
  },
  {
    title: 'Estate Access Road',
    subtitle: '& Drainage',
    location: 'Katugastota, Kandy District',
    description: 'Concrete paving and drainage channel works for a private access road.',
    tags: ['Concrete', 'Drainage'],
    cover: '/images/projects/road-1.jpg',
    images: imgs('road', 5),
  },
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
  { step: '01', title: 'Site visit & consultation', description: 'We walk the site with you, talk through what you need, and understand the land, access, and budget before anything is priced.' },
  { step: '02', title: 'Quotation & planning',      description: 'A clear, itemised quote — materials, labour, and timeline — so there are no surprises once work starts.' },
  { step: '03', title: 'Construction & supervision', description: 'Work begins on the agreed schedule, with the same crew on site every day and progress you can check in on.' },
  { step: '04', title: 'Handover & support',        description: 'A final walkthrough before handover, and we stay reachable after the job is done — not gone the day the invoice is paid.' },
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
          className={`w-3.5 h-3.5 ${i < rating ? 'text-current fill-current' : 'text-current opacity-25'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

// ── Project gallery modal (grid + full-screen viewer) ─────────

type Project = (typeof PROJECTS)[number];

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
        className="max-w-5xl w-full max-h-[90vh] p-0 gap-0 overflow-hidden rounded-none bg-black border-white/15 text-white"
      >
        {viewerIndex === null ? (
          <div className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 sm:p-8 pb-5 border-b border-white/12 flex-shrink-0">
              <DialogTitle className="text-[26px] sm:text-[34px] font-black tracking-[-0.03em] uppercase leading-[0.98] text-white">
                {project.title}
                <span className="block text-white/45">{project.subtitle}</span>
              </DialogTitle>
              <DialogDescription>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.16em] uppercase text-white/50 mt-3">
                  <MapPin className="w-3.5 h-3.5" aria-hidden />
                  {project.location}
                </span>
                <span className="block mt-3 text-[13.5px] text-white/60 leading-relaxed max-w-2xl">
                  {project.description}
                </span>
                <span className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 border border-white/20 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/60">
                      {t}
                    </span>
                  ))}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto scrollbar-thin p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {project.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setViewerIndex(i)}
                    className="relative aspect-[4/3] overflow-hidden group focus:outline-none focus:ring-2 focus:ring-white/60"
                    aria-label={`View photo ${i + 1} of ${project.images.length}`}
                  >
                    <Image src={img} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="280px" />
                    <span className="absolute top-2 left-2 text-[10px] font-bold tracking-widest text-white/70 mix-blend-difference">
                      {pad(i + 1)}
                    </span>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" aria-hidden />
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
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[12px] font-bold tracking-[0.2em] text-white/80 tabular-nums">
              {pad(viewerIndex + 1)} / {pad(project.images.length)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Full-screen project panel ────────────────────────────────

function ProjectPanel({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  const alignRight = index % 2 === 1;

  return (
    <article className="relative min-h-[100svh] w-full overflow-hidden group">
      <Image
        src={project.cover}
        alt={`${project.title} — ${project.location}`}
        fill
        className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/65" aria-hidden />

      <div
        className={`relative min-h-[100svh] flex flex-col justify-end px-5 sm:px-8 lg:px-12 pt-28 pb-14 sm:pb-20 ${
          alignRight ? 'lg:items-end lg:text-right' : ''
        }`}
      >
        <Reveal className={`max-w-3xl ${alignRight ? 'lg:ml-auto' : ''}`}>
          <div
            className={`flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 ${alignRight ? 'lg:justify-end' : ''}`}
          >
            <span className="text-[11px] font-black tracking-[0.3em] text-white/55 tabular-nums whitespace-nowrap">
              {pad(index + 1)} / {pad(PROJECTS.length)}
            </span>
            <span className="hidden sm:block h-px w-14 bg-white/30" aria-hidden />
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.16em] uppercase text-white/55">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
              {project.location}
            </span>
          </div>

          <h3 className="text-[9.5vw] sm:text-[8vw] lg:text-[6.5vw] font-black uppercase tracking-[-0.045em] leading-[0.9] text-white mb-6">
            {project.title}
            <span className="block text-white/50">{project.subtitle}</span>
          </h3>

          <p className="text-[14px] sm:text-[15px] text-white/65 leading-relaxed max-w-lg mb-8 lg:inline-block">
            {project.description}
          </p>

          <div className={`flex ${alignRight ? 'lg:justify-end' : ''}`}>
            <button
              onClick={onOpen}
              aria-label={`View gallery — ${project.title} ${project.subtitle}`}
              className="inline-flex items-center gap-3 h-13 px-7 py-4 bg-white text-black text-[11px] font-black tracking-[0.18em] uppercase hover:bg-white/85 transition-colors duration-300"
            >
              <Images className="w-4 h-4" aria-hidden />
              View {project.images.length} photos
              <Plus className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        </Reveal>
      </div>
    </article>
  );
}

// ── Main landing page ─────────────────────────────────────────

export default function LandingPage() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white font-sans antialiased selection:bg-white selection:text-black">
      <Nav />

      {/* ── 1. Opening frame ──────────────────────────────── */}
      <section className="relative min-h-[100svh] w-full overflow-hidden" aria-label="IN Builders">
        <Image
          src="/images/hero-roofing.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/65" aria-hidden />

        <div className="relative min-h-[100svh] flex flex-col justify-end px-5 sm:px-8 lg:px-12 pb-12 sm:pb-16">
          <div className="max-w-[1700px] mx-auto w-full">
            <p className="text-[10.5px] sm:text-[11px] font-bold tracking-[0.3em] uppercase text-white/60 mb-6 sm:mb-8">
              Sri Lanka — Building Contractors
            </p>

            <h1 className="text-[17vw] sm:text-[15vw] lg:text-[12.5vw] font-black uppercase tracking-[-0.05em] leading-[0.82] text-white mb-8 sm:mb-10">
              We build
              <span className="block text-white/45">it right</span>
            </h1>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-t border-white/15 pt-8">
              <p className="text-[14px] sm:text-[16px] text-white/65 leading-relaxed max-w-md">
                A Sri Lankan construction company delivering homes, renovations, roofing,
                boundary walls, and commercial fit-outs — built on site, on schedule,
                and done properly.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="#work"
                  className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-white text-black text-[11px] font-black tracking-[0.18em] uppercase hover:bg-white/85 transition-colors duration-300"
                >
                  See the work
                  <ArrowDown className="w-4 h-4" aria-hidden />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-3 h-14 px-8 border border-white/30 text-white text-[11px] font-black tracking-[0.18em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
                >
                  Get a quote
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Statement (stark white) ────────────────────── */}
      <section
        id="about"
        className="scroll-mt-20 w-full bg-white text-black px-5 sm:px-8 lg:px-12 py-24 sm:py-36"
        aria-labelledby="about-heading"
      >
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <h2
              id="about-heading"
              className="text-[8.5vw] sm:text-[6vw] lg:text-[4.6vw] font-black uppercase tracking-[-0.045em] leading-[0.92] max-w-5xl mb-16 sm:mb-24"
            >
              A hands-on building crew
              <span className="text-black/30"> — not a call centre.</span>
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20">
            <Reveal delay={80}>
              <div className="space-y-5 text-[14.5px] sm:text-[16px] leading-relaxed text-black/65 max-w-xl">
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
                  <div key={p.title} className="flex gap-6 sm:gap-10 py-6 border-b border-black/15">
                    <span className="text-[11px] font-black tracking-[0.2em] text-black/30 tabular-nums pt-1">
                      {pad(i + 1)}
                    </span>
                    <div>
                      <h3 className="text-[17px] sm:text-[19px] font-black uppercase tracking-[-0.02em] mb-1.5">
                        {p.title}
                      </h3>
                      <p className="text-[13.5px] text-black/55 leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 3. Work — full-screen project frames ──────────── */}
      <section id="work" className="scroll-mt-0 w-full" aria-label="Our work">
        <div className="px-5 sm:px-8 lg:px-12 py-20 sm:py-28 max-w-[1700px] mx-auto">
          <Reveal>
            <p className="text-[10.5px] font-bold tracking-[0.3em] uppercase text-white/45 mb-6">
              Selected Work — {pad(PROJECTS.length)} Projects
            </p>
            <h2 className="text-[11vw] sm:text-[8vw] lg:text-[6vw] font-black uppercase tracking-[-0.05em] leading-[0.88] max-w-4xl">
              Built on the
              <span className="block text-white/35">ground.</span>
            </h2>
          </Reveal>
        </div>

        {PROJECTS.map((p, i) => (
          <ProjectPanel key={p.title} project={p} index={i} onOpen={() => setActiveProject(p)} />
        ))}
      </section>

      {/* ── 4. Capabilities over photo ────────────────────── */}
      <section
        id="services"
        className="scroll-mt-20 relative w-full overflow-hidden"
        aria-labelledby="services-heading"
      >
        <Image
          src="/images/projects/villa-8.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/86" aria-hidden />

        <div className="relative px-5 sm:px-8 lg:px-12 py-24 sm:py-32 max-w-[1700px] mx-auto">
          <Reveal>
            <p className="text-[10.5px] font-bold tracking-[0.3em] uppercase text-white/45 mb-6">
              Capabilities
            </p>
            <h2
              id="services-heading"
              className="text-[10vw] sm:text-[7vw] lg:text-[5vw] font-black uppercase tracking-[-0.05em] leading-[0.9] max-w-3xl mb-14 sm:mb-20"
            >
              From a single wall
              <span className="block text-white/45">to a whole house.</span>
            </h2>
          </Reveal>

          <div className="border-t border-white/15">
            {SERVICES.map((s, i) => (
              <Reveal key={s.title} delay={i * 60}>
                <div className="group grid sm:grid-cols-[auto_1fr_1.1fr] items-baseline gap-x-6 sm:gap-x-10 gap-y-2 py-7 sm:py-8 border-b border-white/15 transition-colors duration-300 hover:bg-white/[0.04]">
                  <span className="text-[11px] font-black tracking-[0.22em] text-white/35 tabular-nums">
                    {pad(i + 1)}
                  </span>
                  <h3 className="text-[22px] sm:text-[30px] lg:text-[34px] font-black uppercase tracking-[-0.035em] leading-[1] text-white/85 group-hover:text-white transition-colors duration-300">
                    {s.title}
                  </h3>
                  <p className="text-[13.5px] text-white/60 leading-relaxed max-w-md">
                    {s.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Numbers over photo ─────────────────────────── */}
      <section className="relative w-full overflow-hidden" aria-label="By the numbers">
        <Image
          src="/images/projects/villa-5.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70" aria-hidden />

        <div className="relative px-5 sm:px-8 lg:px-12 py-20 sm:py-28 max-w-[1700px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {[
              { value: '06', label: 'Projects showcased' },
              { value: '52', label: 'Site photos on file' },
              { value: 'LK', label: 'Island-wide coverage' },
              { value: '100', label: '% site-supervised', suffix: true },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div>
                  <p className="text-[16vw] sm:text-[9vw] lg:text-[6vw] font-black tracking-[-0.06em] leading-[0.82] text-white tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-white/50 mt-4 border-t border-white/20 pt-4">
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Process ────────────────────────────────────── */}
      <section className="w-full bg-white text-black px-5 sm:px-8 lg:px-12 py-24 sm:py-36" aria-labelledby="process-heading">
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <p className="text-[10.5px] font-bold tracking-[0.3em] uppercase text-black/40 mb-6">
              How it runs
            </p>
            <h2
              id="process-heading"
              className="text-[9.5vw] sm:text-[6.5vw] lg:text-[4.6vw] font-black uppercase tracking-[-0.05em] leading-[0.9] max-w-3xl mb-16 sm:mb-24"
            >
              Four steps
              <span className="text-black/30"> — no surprises.</span>
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={i * 90}>
                <div className="border-t-2 border-black pt-6">
                  <p className="text-[13vw] sm:text-[6vw] lg:text-[4vw] font-black tracking-[-0.06em] leading-[0.85] text-black/12 mb-4 tabular-nums">
                    {p.step}
                  </p>
                  <h3 className="text-[17px] font-black uppercase tracking-[-0.02em] mb-2.5">
                    {p.title}
                  </h3>
                  <p className="text-[13.5px] text-black/55 leading-relaxed">{p.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Reviews ────────────────────────────────────── */}
      <section id="reviews" className="scroll-mt-20 w-full bg-black px-5 sm:px-8 lg:px-12 py-24 sm:py-36" aria-labelledby="reviews-heading">
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <p className="text-[10.5px] font-bold tracking-[0.3em] uppercase text-white/45 mb-6">
              Client feedback
            </p>
            <h2 id="reviews-heading" className="sr-only">What clients say</h2>
            <blockquote className="text-[7vw] sm:text-[5vw] lg:text-[3.6vw] font-black uppercase tracking-[-0.04em] leading-[1.02] max-w-5xl mb-8">
              &ldquo;{REVIEWS[0].quote}&rdquo;
            </blockquote>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-16 sm:pb-24 border-b border-white/15">
              <Stars rating={REVIEWS[0].rating} className="text-white" />
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-white/70">
                {REVIEWS[0].name}
                <span className="text-white/35"> — {REVIEWS[0].location}</span>
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 pt-14">
            {REVIEWS.slice(1).map((r, i) => (
              <Reveal key={r.name} delay={i * 70}>
                <div>
                  <Stars rating={r.rating} className="text-white/70 mb-4" />
                  <p className="text-[14px] text-white/65 leading-relaxed mb-4">&ldquo;{r.quote}&rdquo;</p>
                  <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-white/70">
                    {r.name}
                    <span className="text-white/35"> — {r.location}</span>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. FAQ ────────────────────────────────────────── */}
      <section className="w-full bg-black px-5 sm:px-8 lg:px-12 pb-24 sm:pb-36" aria-labelledby="faq-heading">
        <div className="max-w-[1700px] mx-auto">
          <Reveal>
            <p className="text-[10.5px] font-bold tracking-[0.3em] uppercase text-white/45 mb-6">
              Common questions
            </p>
            <h2 id="faq-heading" className="text-[9vw] sm:text-[6vw] lg:text-[4vw] font-black uppercase tracking-[-0.05em] leading-[0.9] max-w-3xl mb-14">
              Before you
              <span className="block text-white/35">get a quote.</span>
            </h2>
          </Reveal>

          <div className="border-t border-white/15 max-w-4xl">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-white/15">
                <summary className="flex items-center justify-between gap-6 py-6 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-[16px] sm:text-[20px] font-black uppercase tracking-[-0.025em] text-white/80 group-hover:text-white transition-colors">
                    {f.q}
                  </span>
                  <ChevronDown className="w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-300 group-open:rotate-180" aria-hidden />
                </summary>
                <p className="pb-6 text-[14px] text-white/55 leading-relaxed max-w-2xl">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Contact — closing frame ────────────────────── */}
      <section id="contact" className="scroll-mt-0 relative min-h-[100svh] w-full overflow-hidden" aria-label="Get in touch">
        <Image
          src="/images/projects/villa-13.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/72" aria-hidden />

        <div className="relative min-h-[100svh] flex flex-col justify-end px-5 sm:px-8 lg:px-12 pt-28 pb-12 sm:pb-16">
          <div className="max-w-[1700px] mx-auto w-full">
            <Reveal>
              <p className="text-[10.5px] font-bold tracking-[0.3em] uppercase text-white/55 mb-6 sm:mb-8">
                Start a project
              </p>
              <h2 className="text-[15vw] sm:text-[12vw] lg:text-[10vw] font-black uppercase tracking-[-0.05em] leading-[0.84] text-white mb-10 sm:mb-14">
                Let&apos;s build
                <span className="block text-white/45">something.</span>
              </h2>

              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-t border-white/15 pt-8">
                <p className="text-[14px] sm:text-[16px] text-white/65 leading-relaxed max-w-md">
                  Tell us about your project and we&apos;ll get back to you with next steps —
                  from a single wall to a full house build, anywhere on the island.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <a
                    href="tel:+94763667924"
                    className="inline-flex items-center justify-center gap-3 h-14 px-8 bg-white text-black text-[12px] font-black tracking-[0.16em] uppercase hover:bg-white/85 transition-colors duration-300"
                  >
                    <Phone className="w-4 h-4" aria-hidden />
                    076 366 7924
                  </a>
                  <a
                    href="mailto:info@inbuilders.lk"
                    className="inline-flex items-center justify-center gap-3 h-14 px-8 border border-white/30 text-white text-[12px] font-black tracking-[0.16em] uppercase hover:bg-white hover:text-black transition-colors duration-300"
                  >
                    <Mail className="w-4 h-4" aria-hidden />
                    Email us
                  </a>
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
            <span className="text-[12px] font-black tracking-[0.16em] uppercase text-white">IN Builders</span>
          </div>

          <p className="text-[10.5px] font-medium tracking-[0.1em] uppercase text-white/35">
            &copy; {new Date().getFullYear()}{' '}IN Builders — Building contractors, Sri Lanka
          </p>

          <div className="flex items-center gap-6 text-[10.5px] font-bold tracking-[0.16em] uppercase text-white/45">
            <a href="tel:+94763667924" className="hover:text-white transition-colors">076 366 7924</a>
            <Link href="/login" className="hover:text-white transition-colors">Team Login</Link>
          </div>
        </div>
      </footer>

      <ProjectGalleryModal project={activeProject} onClose={() => setActiveProject(null)} />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  Instagram,
  Leaf,
  Droplets,
  Wind,
  Recycle,
  Sparkles,
  Heart,
  ArrowRight,
  Menu,
  X,
  Check,
} from "lucide-react";
import {
  Wordmark,
  Monogram,
  SandDollar,
  AmberBottle,
  DryShampooCan,
  Sprig,
  Eucalyptus,
} from "./brand";

/* External destinations — the real store lives on Squarespace. */
const SHOP = "https://jaespace.squarespace.com/shop";
const SHOP_HOME = "https://jaespace.squarespace.com";
const IG = "https://www.instagram.com/myevryday_/";

/* Reveal-on-scroll: adds `.in` to any `.reveal` element as it enters view. */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ------------------------------------------------------------------ Nav --- */
function Nav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Shop", href: SHOP, external: true },
    { label: "Dry Shampoo", href: "#dry-shampoo", external: false },
    { label: "Ingredients", href: "#ingredients", external: false },
    { label: "Our Story", href: "#story", external: false },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-cream/95 backdrop-blur border-b border-border" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="text-espresso" aria-label="My Evryday home">
          <Wordmark className="text-espresso text-xl sm:text-2xl" />
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-espresso/80 hover:text-terracotta transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a href={IG} target="_blank" rel="noreferrer" aria-label="Instagram" className="hidden text-espresso/80 hover:text-terracotta sm:block">
            <Instagram size={19} strokeWidth={1.6} />
          </a>
          <a href={SHOP} target="_blank" rel="noreferrer" className="btn btn-solid hidden sm:inline-flex !px-6 !py-3">
            Shop now
          </a>
          <button className="md:hidden text-espresso" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-cream px-5 py-4">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                onClick={() => setOpen(false)}
                className="py-2.5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-espresso"
              >
                {l.label}
              </a>
            ))}
            <a href={SHOP} target="_blank" rel="noreferrer" className="btn btn-terra mt-3 w-full">
              Shop now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

/* --------------------------------------------------------------- Marquee -- */
function Marquee() {
  const items = [
    "Waterless wash days",
    "Clean, botanical formulas",
    "Cruelty-free, always",
    "For every hair type",
    "Made for real routines",
  ];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-espresso/15 bg-olive py-3 text-cream">
      <div className="marquee-track flex w-max whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="mx-6 inline-flex items-center gap-3 font-display text-[12px] font-semibold uppercase tracking-[0.24em]">
            {t}
            <SandDollar className="h-3 w-3 opacity-70" color="hsl(43 44% 96%)" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Hero -- */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* soft botanical background accents */}
      <Sprig className="pointer-events-none absolute -left-6 top-24 hidden h-72 w-32 text-sage/30 lg:block" color="hsl(68 27% 27% / 0.30)" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
        <div className="reveal">
          <p className="eyebrow mb-5">Naturally better hair days</p>
          <h1 className="font-display text-espresso leading-[0.92] text-[3.4rem] sm:text-[5rem] lg:text-[5.6rem] tracking-[-0.02em]">
            GOOD HAIR,
            <br />
            <span className="text-terracotta">EVERY</span> DAY.
          </h1>
          <p className="mt-6 max-w-md font-serif text-lg leading-relaxed text-espresso/75">
            Clean, botanical hair care built for real life — starting with the dry
            shampoo that refreshes your roots between washes. Less water, less fuss,
            more good hair days.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={SHOP} target="_blank" rel="noreferrer" className="btn btn-solid">
              Shop the collection <ArrowRight size={15} />
            </a>
            <a href="#dry-shampoo" className="btn btn-outline text-espresso">
              Meet the dry shampoo
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-espresso/60">
            <span className="inline-flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.16em]">
              <Leaf size={15} /> Plant-powered
            </span>
            <span className="inline-flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.16em]">
              <Heart size={15} /> Cruelty-free
            </span>
            <span className="inline-flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.16em]">
              <Droplets size={15} /> Waterless
            </span>
          </div>
        </div>

        {/* product stage */}
        <div className="reveal relative flex items-center justify-center">
          <div className="relative aspect-square w-full max-w-md">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-terracotta/90 to-brown" />
            <div className="absolute inset-6 rounded-full border border-cream/25" />
            <Eucalyptus className="absolute -right-2 top-6 h-24 w-56 rotate-6 text-cream/40" color="hsl(43 44% 96% / 0.45)" />
            <DryShampooCan className="absolute left-1/2 top-1/2 h-[86%] -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl" />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
              <SandDollar className="h-10 w-10" color="hsl(34 43% 64%)" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Flagship product - */
function Flagship() {
  const benefits = [
    { icon: Wind, t: "Instant refresh", d: "Soaks up oil and adds body so second-day hair looks freshly washed." },
    { icon: Droplets, t: "Waterless wash", d: "Stretch the time between washes and give your strands a break." },
    { icon: Leaf, t: "Botanical + clean", d: "Rice and tapioca starches, no harsh sulfates or drying alcohols." },
    { icon: Sparkles, t: "No chalky cast", d: "Sheer, invisible finish that melts in — works on every shade." },
  ];
  return (
    <section id="dry-shampoo" className="bg-greige/60">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-2">
        <div className="reveal order-2 md:order-1">
          <p className="eyebrow mb-4">The flagship</p>
          <h2 className="font-display text-espresso text-4xl sm:text-5xl leading-[0.95]">
            ME DRY SHAMPOO
          </h2>
          <p className="mt-5 max-w-md font-serif text-lg leading-relaxed text-espresso/75">
            A weightless, plant-based mist that absorbs excess oil at the root and
            revives volume in seconds — no water, no residue, no white cast. Your
            in-between-washes secret weapon.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.t} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-terracotta/15 text-terracotta">
                  <b.icon size={17} strokeWidth={1.7} />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-espresso">{b.t}</h3>
                  <p className="mt-1 font-serif text-[15px] leading-snug text-espresso/70">{b.d}</p>
                </div>
              </div>
            ))}
          </div>
          <a href={SHOP} target="_blank" rel="noreferrer" className="btn btn-terra mt-9">
            Shop dry shampoo <ArrowRight size={15} />
          </a>
        </div>

        <div className="reveal order-1 flex justify-center md:order-2">
          <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-sm bg-gradient-to-b from-sand/70 to-olive">
            <DryShampooCan className="absolute left-1/2 top-1/2 h-[82%] -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl" />
            <Sprig className="absolute -bottom-4 right-4 h-40 w-20 text-cream/40" color="hsl(43 44% 96% / 0.5)" />
            <div className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-espresso">
              Bestseller
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Collection ---- */
function Collection() {
  const cats = [
    { name: "Dry Shampoo", desc: "Waterless refresh for roots & volume.", art: <DryShampooCan className="h-40" />, bg: "from-terracotta/85 to-brown" },
    { name: "Cleanse & Wash", desc: "Gentle, botanical everyday care.", art: <AmberBottle className="h-44" />, bg: "from-sand/80 to-sage" },
    { name: "Nourish & Oil", desc: "Lightweight shine and repair.", art: <AmberBottle className="h-44" />, bg: "from-olive to-espresso" },
    { name: "Tools & Rituals", desc: "Brushes & extras for the routine.", art: <Sprig className="h-40 text-cream/70" color="hsl(43 44% 96% / 0.75)" />, bg: "from-brown to-espresso" },
  ];
  return (
    <section id="shop" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Shop the range</p>
          <h2 className="font-display text-espresso text-4xl sm:text-5xl">THE COLLECTION</h2>
        </div>
        <a href={SHOP} target="_blank" rel="noreferrer" className="link-underline font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-espresso">
          View all products →
        </a>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cats.map((c) => (
          <a
            key={c.name}
            href={SHOP}
            target="_blank"
            rel="noreferrer"
            className="reveal group flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-shadow hover:shadow-xl"
          >
            <div className={`relative flex h-56 items-center justify-center bg-gradient-to-b ${c.bg}`}>
              <div className="transition-transform duration-500 group-hover:scale-105">{c.art}</div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-lg font-bold uppercase tracking-[0.04em] text-espresso">{c.name}</h3>
              <p className="mt-1 flex-1 font-serif text-[15px] leading-snug text-espresso/70">{c.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
                Shop <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Ingredients --- */
function Ingredients() {
  const made = ["Rice & tapioca starches", "Botanical extracts", "Skin-kind essential oils", "Vegan, plant-derived"];
  const never = ["Sulfates (SLS/SLES)", "Parabens", "Drying alcohols", "Animal testing"];
  return (
    <section id="ingredients" className="bg-espresso text-cream">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">What's inside</p>
          <h2 className="font-display text-4xl sm:text-5xl">CLEAN, ON PURPOSE</h2>
          <p className="mx-auto mt-4 max-w-lg font-serif text-lg leading-relaxed text-cream/75">
            We keep our formulas short and thoughtful — powered by plants, free from
            the stuff your hair and scalp don't need.
          </p>
        </div>
        <div className="reveal mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          <div className="rounded-sm border border-cream/15 bg-cream/[0.04] p-7">
            <h3 className="mb-5 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
              <Leaf size={16} /> Made with
            </h3>
            <ul className="space-y-3">
              {made.map((m) => (
                <li key={m} className="flex items-center gap-3 font-serif text-[15px] text-cream/85">
                  <Check size={16} className="flex-none text-terracotta" /> {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-sm border border-cream/15 bg-cream/[0.04] p-7">
            <h3 className="mb-5 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.18em] text-sand">
              <X size={16} /> Never
            </h3>
            <ul className="space-y-3">
              {never.map((m) => (
                <li key={m} className="flex items-center gap-3 font-serif text-[15px] text-cream/85">
                  <X size={16} className="flex-none text-cream/45" /> {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Story ----- */
function Story() {
  return (
    <section id="story" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-2">
        <div className="reveal relative flex justify-center">
          <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-sm bg-gradient-to-br from-sage to-olive">
            <div className="absolute inset-0 flex items-center justify-center">
              <SandDollar className="h-40 w-40" color="hsl(34 43% 64%)" />
            </div>
            <Eucalyptus className="absolute bottom-6 left-1/2 h-20 w-64 -translate-x-1/2 text-cream/45" color="hsl(43 44% 96% / 0.5)" />
            <div className="absolute left-5 top-5">
              <Monogram className="text-cream text-4xl" />
            </div>
          </div>
        </div>
        <div className="reveal">
          <p className="eyebrow mb-4">Our story</p>
          <h2 className="font-display text-espresso text-4xl sm:text-5xl leading-[0.95]">
            MADE FOR THE
            <br />
            IN-BETWEEN DAYS
          </h2>
          <p className="mt-6 font-serif text-lg leading-relaxed text-espresso/75">
            My Evryday started with a simple idea: great hair shouldn't take a whole
            morning — or a whole bottle of product. We set out to make honest,
            plant-based essentials for the days between washes, the busy mornings,
            and everything in between.
          </p>
          <p className="mt-4 font-serif text-lg leading-relaxed text-espresso/75">
            Every formula is designed to be gentle on your hair, your scalp, and the
            planet — earthy, effective, and easy to reach for, every single day.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <SandDollar className="h-8 w-8 text-sand" color="hsl(34 43% 64%)" />
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-espresso/60">
              Clean · Botanical · Everyday
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Ritual --- */
function Ritual() {
  const steps = [
    { n: "01", t: "Shake & spray", d: "Section dry hair and mist at the roots, 8–10 inches away." },
    { n: "02", t: "Wait a moment", d: "Let the botanical starches absorb oil for 30 seconds." },
    { n: "03", t: "Tousle & go", d: "Massage in and brush through for refreshed, voluminous hair." },
  ];
  return (
    <section className="bg-greige/60">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="reveal mb-12 text-center">
          <p className="eyebrow mb-3">The ritual</p>
          <h2 className="font-display text-espresso text-4xl sm:text-5xl">THREE STEPS TO FRESH</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="reveal text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-terracotta/40 font-display text-xl font-bold text-terracotta">
                {s.n}
              </div>
              <h3 className="font-display text-lg font-bold uppercase tracking-[0.06em] text-espresso">{s.t}</h3>
              <p className="mx-auto mt-2 max-w-xs font-serif text-[15px] leading-snug text-espresso/70">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Newsletter ----- */
function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    // NOTE: connect this to a real list provider (e.g. Squarespace / Mailchimp /
    // Klaviyo) endpoint to persist signups. For now we confirm on the client.
    try {
      const key = "myevryday.subscribers";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      if (!list.includes(email)) list.push(email);
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      /* ignore storage errors */
    }
    setDone(true);
  };

  return (
    <section className="bg-olive text-cream">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
        <div className="reveal">
          <SandDollar className="mx-auto mb-6 h-10 w-10" color="hsl(34 43% 64%)" />
          <p className="eyebrow mb-3 !text-sand">Join the everyday</p>
          <h2 className="font-display text-4xl sm:text-5xl">GOOD HAIR IN YOUR INBOX</h2>
          <p className="mx-auto mt-4 max-w-md font-serif text-lg leading-relaxed text-cream/75">
            Early access, hair-day tips, and the occasional treat. No spam — just
            good hair days.
          </p>
          {done ? (
            <p className="mt-8 inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.16em] text-sand">
              <Check size={18} /> You're on the list — talk soon!
            </p>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email address"
                className="flex-1 rounded-sm border border-cream/25 bg-cream/[0.06] px-4 py-3.5 font-serif text-[15px] text-cream placeholder:text-cream/45 outline-none focus:border-sand"
              />
              <button type="submit" className="btn btn-terra">
                Sign up
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Instagram ------ */
function InstagramStrip() {
  const tiles = [
    "from-terracotta to-brown",
    "from-sage to-olive",
    "from-sand to-espresso",
    "from-brown to-espresso",
    "from-olive to-sage",
    "from-espresso to-terracotta",
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <div className="reveal mb-8 text-center">
        <p className="eyebrow mb-3">Follow along</p>
        <a href={IG} target="_blank" rel="noreferrer" className="font-display text-3xl font-bold text-espresso hover:text-terracotta">
          @myevryday_
        </a>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {tiles.map((t, i) => (
          <a
            key={i}
            href={IG}
            target="_blank"
            rel="noreferrer"
            className={`group relative flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br ${t}`}
            aria-label="View on Instagram"
          >
            <SandDollar className="h-8 w-8 opacity-40 transition-opacity group-hover:opacity-0" color="hsl(43 44% 96% / 0.6)" />
            <Instagram size={22} className="absolute text-cream opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Footer -- */
function Footer() {
  const cols = [
    { title: "Shop", links: [["All products", SHOP], ["Dry shampoo", SHOP], ["Store home", SHOP_HOME]] as [string, string][] },
    { title: "Brand", links: [["Our story", "#story"], ["Ingredients", "#ingredients"], ["The ritual", "#dry-shampoo"]] as [string, string][] },
  ];
  return (
    <footer className="bg-espresso text-cream">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Wordmark className="text-cream text-2xl" />
            <p className="mt-4 max-w-xs font-serif text-[15px] leading-relaxed text-cream/70">
              Clean, botanical hair care for real, everyday routines. Refresh,
              nourish, and go — every single day.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <a href={IG} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-cream/80 hover:text-sand">
                <Instagram size={20} />
              </a>
              <SandDollar className="h-7 w-7" color="hsl(34 43% 64%)" />
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="mb-4 font-display text-[12px] font-bold uppercase tracking-[0.2em] text-sand">{c.title}</h4>
              <ul className="space-y-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="font-serif text-[15px] text-cream/70 hover:text-cream link-underline"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-cream/15 pt-6 sm:flex-row">
          <p className="font-serif text-[13px] text-cream/55">
            © {new Date().getFullYear()} My Evryday. All rights reserved.
          </p>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-cream/50">
            Naturally better hair days
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ================================================================== Page == */
export default function Home() {
  useReveal();
  const topRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={topRef} className="min-h-screen bg-cream font-serif text-espresso">
      <Nav />
      <Hero />
      <Marquee />
      <Flagship />
      <Collection />
      <Ingredients />
      <Story />
      <Ritual />
      <Newsletter />
      <InstagramStrip />
      <Footer />
    </div>
  );
}

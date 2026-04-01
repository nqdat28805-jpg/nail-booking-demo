import Image from "next/image";
import Link from "next/link";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4x-l9eaK_rL0KOpH2Pzz14wxB3ME8dKlOuqNNKLlN-yrnXFJd0h83szIiR5r5e9iuvfG2l0NOwf5kQURDIiB2nTDHJ7Nx-cjH_lTQXfT_iwp1sgduMFvjV9WoYDGX0_6Ovu34ttPtp16MnlPy_9VEvEt2AUmdfJ9KG5nQuGCfMuDjM_OelSbIyQbt373YJVbv_8yu3nz7ehBDaNNyGqMiLtaiN9OazBkZXtnhrIxNb1ZhbUul6nq2U-cbASuf6sAjLs5VQMBkfaC0";

const featuredServices = [
  {
    name: "Luxury Manicure",
    price: "$85+",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7B1iL_j_vOxU4I9KNUP9VW-cjK7aXA2B9vCyy7ICaGuOVGb4RsdBnt3jDv7A4V7kgtsd6sgs4NWRHfNP9e0bZOziArCTA7jzyCjoum5OkBVhnLoczaYLlVq9DD4RoURAKpvyKhOzvrW2ShPzU5zRwlAuRmYyHodnId-Io9V0gAlHcV7kKdK9Ty759B2caKzRF29Ed8qE5vnKsLfjEc8RrmwoUnYdECrihWqma1IIOME_xZ5WCwvKXH0f-BKj1mOLGBIHap02ORdta",
  },
  {
    name: "Art Extensions",
    price: "$120+",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCwDHgspeTfOTWdaAIkz6fVlodSmfNjYp-uecY95wqDonJfCRyM2nG8beIdgWYUZjUe4SBQOzlc0mxL5SNfZnDxptQrKioIN07qO6UrCyY5ohTxrm4HcYg1Ru5_zQd2YoDysW8935eCmCdOQU7uYbuTDtJhtuKbFJ3VN1SgOELK3dnmH8_k4tSf_Lp6OdmFdStLCXHn7DFpQ0TaSM1_GAkXkKy8bkWBKB6mDke_dv4mDPuDKQDzEaFj2-edpFaecsnnb0KpI6PfKKoT",
  },
];

const footerLinks = ["Services", "Gallery"];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fdf9f6] text-[#1c1b1a]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fdf9f6]/80 shadow-[0_12px_40px_rgba(127,82,83,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <button
            type="button"
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#7f5253]"
          >
            <span className="flex flex-col gap-1">
              <span className="block h-[1.5px] w-3 bg-current" />
              <span className="block h-[1.5px] w-3 bg-current" />
              <span className="block h-[1.5px] w-3 bg-current" />
            </span>
          </button>
          <span className="font-serif text-[1.05rem] font-bold uppercase tracking-[-0.02em] text-[#7f5253]">
            19NAIL.STUDIO
          </span>
          <span className="w-10" aria-hidden="true" />
        </div>
      </header>

      <main className="pt-16">
        <section className="relative flex min-h-[80svh] flex-col justify-end px-5 pb-16 pt-10 md:min-h-[92svh] md:px-8 md:pb-20">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Minimalist nail art aesthetic"
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-95 saturate-[0.88]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(253,249,246,0.06)_0%,rgba(253,249,246,0.28)_42%,rgba(253,249,246,0.88)_80%,#fdf9f6_100%)]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <div className="max-w-sm space-y-8 md:max-w-md">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f5253]">
                  The Ethereal Atelier
                </p>
                <h1 className="font-serif text-[3.15rem] italic leading-[1.04] tracking-[-0.04em] text-[#1c1b1a] md:text-[4.8rem]">
                  Vẻ đẹp tinh tuyển
                  <br />
                  trong từng nét móng
                </h1>
                <p className="max-w-[18rem] text-base font-light leading-7 text-[#514443] md:max-w-[21rem] md:text-lg">
                  Một không gian làm móng tinh tế, nơi từng chi tiết được chăm
                  chút nhẹ nhàng và chỉn chu.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/dat-lich"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] px-10 py-4 text-[11px] font-bold uppercase tracking-[0.28em] text-white shadow-[0_12px_40px_rgba(127,82,83,0.16)] transition-transform active:scale-[0.98] md:w-auto"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#837373]">
              Our Curation
            </p>
            <h2 className="font-serif text-[2.05rem] tracking-[-0.03em] text-[#1c1b1a] md:text-[2.5rem]">
              Signature Services
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-10">
            {featuredServices.map((service) => (
              <article key={service.name} className="group space-y-4">
                <div className="overflow-hidden rounded-xl bg-[#e5e2df] shadow-[0_12px_40px_rgba(127,82,83,0.04)]">
                  <Image
                    src={service.image}
                    alt={service.name}
                    width={960}
                    height={540}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="aspect-video h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex items-end justify-between gap-4 px-1">
                  <h3 className="font-serif text-xl text-[#1c1b1a] md:text-2xl">
                    {service.name}
                  </h3>
                  <span className="shrink-0 text-sm text-[#7f5253]">
                    {service.price}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>

      <footer className="mb-16 bg-[#f7f3f0] px-8 py-14 text-center md:py-16">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <p className="font-serif text-xl italic text-[#7f5253]">
            19NAIL.STUDIO
          </p>
          <nav className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <span
                key={link}
                className="text-[10px] uppercase tracking-[0.1em] text-[#837373]"
              >
                {link}
              </span>
            ))}
          </nav>
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#7f5253]">
            © 2024 19NAIL.STUDIO.
          </p>
        </div>
      </footer>

      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href="/dat-lich"
          aria-label="Book now"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] text-white shadow-[0_8px_30px_rgba(127,82,83,0.3)] transition-transform active:scale-90"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
            <path d="M7.5 3.5v3" />
            <path d="M16.5 3.5v3" />
            <path d="M3.5 9.5h17" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

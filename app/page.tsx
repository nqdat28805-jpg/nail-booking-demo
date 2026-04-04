import Image from "next/image";
import Link from "next/link";
import { NINETEEN_NAIL_STUDIO_PRICE_CONFIG } from "@/src/config/shops/19nail-studio/price-list";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4x-l9eaK_rL0KOpH2Pzz14wxB3ME8dKlOuqNNKLlN-yrnXFJd0h83szIiR5r5e9iuvfG2l0NOwf5kQURDIiB2nTDHJ7Nx-cjH_lTQXfT_iwp1sgduMFvjV9WoYDGX0_6Ovu34ttPtp16MnlPy_9VEvEt2AUmdfJ9KG5nQuGCfMuDjM_OelSbIyQbt373YJVbv_8yu3nz7ehBDaNNyGqMiLtaiN9OazBkZXtnhrIxNb1ZhbUul6nq2U-cbASuf6sAjLs5VQMBkfaC0";

const footerLinks = ["Dịch vụ", "Bộ sưu tập"];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fdf9f6] text-[#1c1b1a]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fdf9f6]/80 px-6 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <span className="w-4" aria-hidden="true" />
          <span className="font-serif text-xl tracking-[-0.02em] text-primary">
            19NAIL.STUDIO
          </span>
          <span className="w-4 text-right text-xs text-primary" aria-hidden="true">
            •
          </span>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative flex min-h-[80svh] flex-col justify-end px-5 pb-16 pt-10 md:min-h-[92svh] md:px-8 md:pb-20">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Không gian làm móng tối giản và tinh tế"
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-95 saturate-[0.88]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(253,249,246,0.06)_0%,rgba(253,249,246,0.28)_42%,rgba(253,249,246,0.88)_80%,#fdf9f6_100%)]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <div className="max-w-sm space-y-8 md:max-w-md">
              <div className="space-y-5">
                <h1 className="font-serif text-[3rem] italic leading-[1.06] tracking-[-0.04em] text-[#1c1b1a] md:text-[4.55rem]">
                  Nét đẹp bắt đầu từ những chi tiết nhỏ
                </h1>
                <p className="max-w-[18rem] text-base font-light leading-7 text-[#514443] md:max-w-[21rem] md:text-lg">
                  Một không gian làm móng tinh tế, nơi từng chi tiết được chăm
                  chút nhẹ nhàng và chỉn chu.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/dat-lich"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#7f5253_0%,#d9a2a2_100%)] px-10 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-[0_12px_40px_rgba(127,82,83,0.16)] transition-transform active:scale-[0.98] md:w-auto"
                >
                  Đặt lịch ngay
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h2 className="font-serif text-[2.05rem] tracking-[-0.03em] text-[#1c1b1a] md:text-[2.5rem]">
                Bảng giá dịch vụ
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-[#6e605d] md:text-[15px]">
                Bảng giá được cấu hình riêng cho 19NAIL.STUDIO, trình bày lại từ
                menu tham chiếu để giữ giao diện nhất quán với website.
              </p>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f7b74]">
              Áp dụng tại 19NAIL.STUDIO
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {NINETEEN_NAIL_STUDIO_PRICE_CONFIG.categories.map((category) => (
              <article
                key={category.id}
                className="rounded-[1.35rem] border border-[#eadfda] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(249,242,238,0.96)_100%)] p-5 shadow-[0_12px_40px_rgba(127,82,83,0.05)]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h3 className="font-serif text-[1.45rem] tracking-[-0.03em] text-[#1c1b1a]">
                    {category.title}
                  </h3>
                  <span className="h-px flex-1 bg-[#e4d6d0]" aria-hidden="true" />
                </div>

                <div className="space-y-4">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1rem] border border-white/70 bg-white/70 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-6 text-[#2c2624]">
                            {item.name}
                          </p>
                          {item.notes ? (
                            <p className="mt-1 text-xs leading-5 text-[#8a7872]">
                              {item.notes}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-[#7f5253]">
                          {item.priceLabel}
                        </span>
                      </div>

                      {"reviewStatus" in item && item.reviewStatus ? (
                        <p className="mt-3 inline-flex rounded-full bg-[#f4e7dc] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b5f37]">
                          {item.reviewStatus === "review" ? "Review" : "OCR uncertain"}
                        </p>
                      ) : null}
                    </div>
                  ))}
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
          aria-label="Đặt lịch ngay"
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

import danLogo from "@/assets/logo-dan-zambia.png";
import panosLogo from "@/assets/logo-panos.png";

export function PartnerLogos({ className = "" }: { className?: string }) {
  return (
    <section className={`container-page py-8 ${className}`}>
      <p className="text-center text-xs uppercase tracking-widest font-semibold text-muted-foreground">
        Developed by DAN-Zambia in partnership with Panos Institute Southern Africa
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
        <img
          src={danLogo}
          alt="DAN-Zambia — Digital Awareness Network"
          loading="lazy"
          className="h-16 sm:h-20 w-auto object-contain"
        />
        <img
          src={panosLogo}
          alt="Panos Institute Southern Africa — Communication for Empowerment"
          loading="lazy"
          className="h-12 sm:h-14 w-auto object-contain"
        />
      </div>
    </section>
  );
}

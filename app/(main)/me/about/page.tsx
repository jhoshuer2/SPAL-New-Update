"use client";
// L11 About & legal: terms, privacy policy, version.
import { FF, Section, TopBar, cardCls } from "@/components/journey/ui";

export default function About() {
  return (
    <div data-testid="screen-L11" className="min-h-full pb-10 bg-spal-bg">
      <TopBar title="About & legal" />
      <div className="px-5 space-y-5">
        <div className={`${cardCls} p-5 text-center`}>
          <p style={{ fontFamily: FF }} className="text-[28px] font-bold text-spal-navy">Spal</p>
          <p className="text-[14px] text-neutral-600">Every stage of your business</p>
          <p className="mt-2 text-[12px] text-neutral-400">Version {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}</p>
        </div>
        <Section title="Legal">
          <div className={`${cardCls} p-4 space-y-3`}>
            <p className="text-[14px] text-neutral-700 leading-snug"><b>Terms of use</b> and <b>Privacy policy</b> are being finalised with legal advice and will be published here before public launch.</p>
            <p className="text-[12px] text-neutral-500 leading-snug">In short, for now: your business numbers are private, you choose what to share, Spal is a companion and not a lawyer, accountant or financial adviser, and you can delete your account at any time.</p>
          </div>
        </Section>
      </div>
    </div>
  );
}

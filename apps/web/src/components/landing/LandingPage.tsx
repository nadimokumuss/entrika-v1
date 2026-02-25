"use client";

import LandingHeader from "./LandingHeader";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";
import FeaturesSection from "./FeaturesSection";
import CategoriesSection from "./CategoriesSection";
import ReactionsSection from "./ReactionsSection";
import TrustSection from "./TrustSection";
import StatsSection from "./StatsSection";
import CTASection from "./CTASection";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--background)]" style={{ scrollBehavior: "smooth" }}>
      <LandingHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CategoriesSection />
        <ReactionsSection />
        <TrustSection />
        <StatsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}

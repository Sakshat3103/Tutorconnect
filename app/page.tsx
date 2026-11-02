import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import FeaturedTeachers from "@/components/FeaturedTeachers";
import { AiExplainerShort } from "@/components/AiExplainer";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <AiExplainerShort />
      <FeaturedTeachers />
    </>
  );
}

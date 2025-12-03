import BlockdagBackground from '@/components/BlockdagBackground';
import HeroSection from '@/components/HeroSection';
import FeaturedCourses from '@/components/FeaturedCourses';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen" data-testid="page-home">
      <BlockdagBackground />
      <HeroSection />
      <div className="bg-background relative z-10">
        <FeaturedCourses />
        <Footer />
      </div>
    </div>
  );
}

import Hero from '@/components/sections/Hero/Hero';
import Portfolio from '@/components/sections/Portfolio/Portfolio';
import Clients from '@/components/sections/Clients/Clients';
import Contact from '@/components/sections/Contact/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Clients />
      <Portfolio />
      <Contact />
    </>
  );
}

import type { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: 'IN Builders — Construction Contractors, Sri Lanka',
  description:
    'IN Builders is a Sri Lankan construction company delivering homes, renovations, roofing, boundary walls, and commercial fit-outs — based in the Kandy District, working island-wide.',
};

export default function Page() {
  return <HomeClient />;
}

import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'PPEC Stream | Show sign-up', description:'Claim your slot in our 15-hour community stream. Explore the line-up and add your show.'};
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}

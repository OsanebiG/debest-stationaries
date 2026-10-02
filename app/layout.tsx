import './globals.css';
import Navbar from '@/components/Navbar';
export const metadata={title:'DEBEST Stationaries',description:'Everything you need for school, office and everyday life.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Navbar/>{children}</body></html>}

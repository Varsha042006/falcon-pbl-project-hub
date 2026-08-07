import "./globals.css"; import { Header } from "@/components/Header"; import { Footer } from "@/components/Footer";
export const metadata={title:"Falcon PBL Project Hub",description:"Project publishing, team formation and PBL allocation portal"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/><main>{children}</main><Footer/></body></html>}

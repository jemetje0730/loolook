import './global.css';
import TopNav from '@/components/TopNav';

export const metadata = {
  title: 'LooLook',
  description: 'Public toilet map for Korea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />    {/* ← 모든 페이지 상단에 고정 */}
        <div> {/* Nav 높이만큼 여백 */}
          {children}
        </div>
      </body>
    </html>
  );
}


'use client';

import { usePathname } from 'next/navigation';
import AppLayout from '@/app/layout-client';

export default function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return isAdminPage ? <>{children}</> : <AppLayout>{children}</AppLayout>;
}

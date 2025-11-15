
'use client';

import { usePathname } from 'next/navigation';
import AppLayout from '@/app/layout-client';
import AdminLayout from '@/app/admin/layout';
import EnrollerLayout from '@/app/enroller/layout';

export default function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin') {
      return <>{children}</>;
    }
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (pathname.startsWith('/enroller')) {
     if (pathname === '/enroller') {
      return <>{children}</>;
    }
    return <EnrollerLayout>{children}</EnrollerLayout>;
  }

  // Handle root login/signup pages that shouldn't have the main layout
  if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}

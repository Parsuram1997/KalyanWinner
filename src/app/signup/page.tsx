
import { redirect } from 'next/navigation';

export default function SignupPage() {
  // Redirect to login page as public signup is disabled
  redirect('/login');
}

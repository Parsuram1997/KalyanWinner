
'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { SidebarMenuButton } from './ui/sidebar';

interface ShareButtonProps {
  enrollerId: string | null | undefined;
}

export default function ShareButton({ enrollerId }: ShareButtonProps) {
  const handleShare = async () => {
    if (!enrollerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find your referral ID.',
      });
      return;
    }

    const shareUrl = `${window.location.origin}/signup?enrollerId=${enrollerId}`;
    const shareData = {
      title: 'Join Kalyan Winner!',
      text: 'Join me on Kalyan Winner and start playing. Use my link to sign up!',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: 'Link Shared!', description: 'Your referral link has been shared.' });
      } catch (error) {
        // This can happen if the user cancels the share sheet
        console.log('Share was cancelled or failed', error);
      }
    } else {
      // Fallback for browsers that do not support Web Share API
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: 'Link Copied!',
          description: 'Your referral link has been copied to your clipboard.',
        });
      }).catch(err => {
        console.error('Could not copy text: ', err);
        toast({
            variant: 'destructive',
            title: 'Failed to Copy',
            description: 'Could not copy the referral link.',
        });
      });
    }
  };

  return (
    <SidebarMenuButton onClick={handleShare}>
        <Share2 />
        Share App
    </SidebarMenuButton>
  );
}

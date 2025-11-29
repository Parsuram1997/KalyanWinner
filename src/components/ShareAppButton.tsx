
'use client';

import { useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Define the shape of the enroller data we expect
interface Enroller {
    customId?: string;
}

interface ShareAppButtonProps {
    enroller: Enroller | null;
}

export function ShareAppButton({ enroller }: ShareAppButtonProps) {

    useEffect(() => {
        const button = document.getElementById('share-app-button');

        const handleShareClick = () => {
            if (!enroller || !enroller.customId) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not get your referral ID. Please try again.',
                });
                return;
            }

            const shareUrl = `${window.location.origin}/signup?enrollerId=${enroller.customId}`;
            const shareData = {
                title: 'Join Kalyan Winner!',
                text: 'Join me on Kalyan Winner and start playing. Use my link to sign up!',
                url: shareUrl,
            };

            if (navigator.share) {
                navigator.share(shareData).catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error('Share failed:', error);
                        toast({
                            variant: 'destructive',
                            title: 'Share Failed',
                            description: `Share failed: ${error.name}: ${error.message}`,
                        });
                    }
                });
            } else {
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

        if (button) {
            // Remove any existing listener to prevent duplicates on re-render
            // Though with this setup, it's less of an issue.
            button.removeEventListener('click', handleShareClick); 
            
            // Add the native event listener
            button.addEventListener('click', handleShareClick);
        }

        // Cleanup function to remove the event listener when the component unmounts
        return () => {
            if (button) {
                button.removeEventListener('click', handleShareClick);
            }
        };
    }, [enroller]); // Re-run effect if enroller data changes

    return (
        <button
            id="share-app-button"
            className={cn(
                "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 h-8"
            )}
        >
            <Share2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Share App</span>
        </button>
    );
}


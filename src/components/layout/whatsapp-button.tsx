'use client';

import { MessageCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { formatWhatsAppUrl } from '@/lib/utils';

export function WhatsAppButton() {
  const whatsappUrl = formatWhatsAppUrl(
    siteConfig.whatsapp,
    'Hola, me gustaria consultar sobre sus servicios.'
  );

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elevated transition-all hover:scale-110 active:scale-95"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute inset-0 -z-10 animate-pulse-subtle rounded-full bg-[#25D366]/40" />
    </a>
  );
}

const whatsappMessage = 'Hola, quiero instalar FoodReel en mi restaurante';
const whatsappHref = `https://wa.me/573045818262?text=${encodeURIComponent(whatsappMessage)}`;

export function WhatsAppInstallButton() {
  return (
    <a
      aria-label="Enviar mensaje por WhatsApp para instalar FoodReel"
      className="absolute bottom-4 right-3 z-30 grid size-12 place-items-center rounded-2xl border border-white/15 bg-[#25D366] text-white shadow-2xl shadow-black/35 transition hover:brightness-110"
      href={whatsappHref}
      rel="noreferrer"
      target="_blank"
      title="WhatsApp"
    >
      <svg aria-hidden="true" className="size-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.52 14.95L2.3 21.4l4.56-1.2A9.93 9.93 0 1 0 12.04 2Zm.01 1.76a8.16 8.16 0 1 1-4.16 15.18l-.3-.18-2.7.7.72-2.62-.2-.32a8.16 8.16 0 0 1 6.64-12.76Zm-3.35 4.3c-.17 0-.45.06-.68.31-.24.26-.9.88-.9 2.15 0 1.26.92 2.49 1.05 2.66.13.17 1.78 2.85 4.4 3.88 2.18.86 2.63.69 3.1.65.48-.04 1.55-.63 1.76-1.24.22-.61.22-1.13.15-1.24-.06-.11-.24-.18-.5-.31-.27-.14-1.56-.77-1.8-.85-.24-.09-.42-.14-.6.13-.17.27-.69.85-.84 1.03-.15.18-.31.2-.57.07-.27-.13-1.12-.41-2.13-1.31-.79-.7-1.32-1.57-1.47-1.84-.16-.26-.02-.41.11-.54.12-.12.27-.31.4-.47.13-.15.17-.26.26-.44.09-.18.04-.34-.02-.47-.07-.13-.6-1.45-.82-1.98-.22-.51-.44-.44-.6-.45h-.52Z" />
      </svg>
    </a>
  );
}

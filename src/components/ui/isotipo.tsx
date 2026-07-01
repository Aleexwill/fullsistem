import Image from 'next/image';

interface IsotipoProps {
  size?: number;
  className?: string;
}

/**
 * Logo icon only (isotipo) - uses the actual brand logo image
 */
export function Isotipo({ size = 48, className = '' }: IsotipoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Full Service & Clean"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      priority
    />
  );
}

interface LogoFullProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Full logo with text — "Full Service & Clean"
 */
export function LogoFull({ variant = 'dark', size = 'md' }: LogoFullProps) {
  const textColor = variant === 'dark' ? '#F4F7FB' : '#0B1120';

  const sizes = {
    sm: { img: 32, text: 'text-[0.7rem]' },
    md: { img: 44, text: 'text-[0.85rem]' },
    lg: { img: 56, text: 'text-[1.1rem]' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Full Service & Clean"
        width={s.img}
        height={s.img}
        className="object-contain"
        priority
      />
      <div className="flex flex-col">
        <span
          className={`font-display ${s.text} font-bold uppercase leading-none`}
          style={{ letterSpacing: '-0.01em', color: textColor }}
        >
          <span className="text-blue">Full Service</span>
          {' '}
          <span className="text-orange">&amp; Clean</span>
        </span>
      </div>
    </div>
  );
}

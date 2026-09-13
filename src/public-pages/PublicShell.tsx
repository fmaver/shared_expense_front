import React from 'react';
import { JirensMark } from '@/components/brand/JirensMark';

/**
 * El marco de las pantallas públicas: invitación y link de grupo.
 *
 * Es lo primero que ve alguien que todavía no tiene cuenta, así que usa el mismo material que
 * el ingreso — tinta a sangre, la marca arriba y una tarjeta de papel — y no una versión
 * aparte que se parezca de lejos.
 */
export function PublicShell({
  title, subtitle, children,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <JirensMark className="text-paper" size={40} />
        {title && (
          <h1 className="mt-5 font-display text-[30px] leading-[1.15] text-paper">{title}</h1>
        )}
        {subtitle && (
          <p className="mt-2.5 text-[14px] font-medium leading-[1.5] text-muted-on-dark">
            {subtitle}
          </p>
        )}
        <div className="mt-6 rounded-[24px] bg-paper p-5">{children}</div>
      </div>
    </div>
  );
}

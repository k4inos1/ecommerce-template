import Link from 'next/link';

type Section = {
  title: string;
  items: string[];
};

export function InfoPage({
  title,
  subtitle,
  tag,
  sections,
}: {
  title: string;
  subtitle: string;
  tag: string;
  sections: Section[];
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-8">
        ← Volver al inicio
      </Link>

      <div className="card p-8 md:p-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] font-semibold text-teal-200 uppercase tracking-widest mb-4">
          {tag}
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">{title}</h1>
        <p className="text-slate-400 text-base leading-relaxed mb-8">{subtitle}</p>

        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-white mb-2">{section.title}</h2>
              <ul className="space-y-2 text-sm text-slate-400">
                {section.items.map(item => (
                  <li key={item} className="flex gap-2">
                    <span className="text-teal-300 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-xs text-slate-500">
          ¿Necesitas ayuda personalizada? Escríbenos desde el chat de soporte en la esquina inferior.
        </div>
      </div>
    </div>
  );
}

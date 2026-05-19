const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
  <div className="bg-[var(--color-y2k-bg-main)] border-4 p-6 group transition-all hover:-translate-y-2" style={{ borderColor: color, boxShadow: `6px 6px 0px 0px ${color}` }}>
    <div className="mb-4 inline-block p-3 border-2" style={{ borderColor: color, color: color }}>
      <Icon size={24} />
    </div>
    <h3 className="text-[var(--color-y2k-text-main)] font-black uppercase italic text-lg mb-2 tracking-tighter" style={{ color }}>{title}</h3>
    <p className="text-[var(--color-y2k-text-muted)] text-xs font-bold leading-relaxed">{desc}</p>
  </div>
);

export default FeatureCard;
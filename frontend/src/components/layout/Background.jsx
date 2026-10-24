// Fixed decorative layers: gradient orbs + fine grid. Sits behind everything.
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="orb orb-1 -top-48 -left-40 h-[600px] w-[600px] bg-primary/[0.18]" />
      <div className="orb orb-2 top-1/3 -right-40 h-[500px] w-[500px] bg-accent/10" />
      <div className="orb orb-3 -bottom-80 left-1/4 h-[700px] w-[700px] bg-teal-500/[0.12]" />
      <div className="grid-overlay absolute inset-0" />
      {/* Vignette keeps edges deep */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(6,16,12,0.7)_100%)]" />
    </div>
  )
}

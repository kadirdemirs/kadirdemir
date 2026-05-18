import './Skeleton.css'

export function SkeletonBox({ width = '100%', height = 16, radius = 8, style }) {
  return (
    <span
      className="kd-skeleton"
      style={{ width, height, borderRadius: radius, display: 'inline-block', ...style }}
    />
  )
}

export function SkeletonBlogCard() {
  return (
    <div className="kd-skeleton-card">
      <SkeletonBox width="100%" height={160} radius={12} />
      <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonBox width="40%" height={10} radius={4} />
        <SkeletonBox width="90%" height={16} radius={6} />
        <SkeletonBox width="60%" height={16} radius={6} />
        <SkeletonBox width="80%" height={10} radius={4} style={{ marginTop: 6 }} />
      </div>
    </div>
  )
}

export function SkeletonVideoCard() {
  return (
    <div className="kd-skeleton-card">
      <SkeletonBox width="100%" height={180} radius={12} />
      <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonBox width="95%" height={14} radius={6} />
        <SkeletonBox width="55%" height={11} radius={4} />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6, kind = 'blog' }) {
  const Card = kind === 'video' ? SkeletonVideoCard : SkeletonBlogCard
  return (
    <div className="kd-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </div>
  )
}

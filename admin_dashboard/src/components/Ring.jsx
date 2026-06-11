export default function Ring({ percent, tone, label, sub, size = 76 }) {
  const radius = size === 76 ? 30 : 22;
  const center = size / 2;
  const circumference = Math.round(2 * Math.PI * radius);
  const fill = Math.round(((percent ?? 0) / 100) * circumference);
  return (
    <div className="circle-wrap">
      <div className="circle-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle className="ring-bg" cx={center} cy={center} r={radius} />
          <circle
            className={`ring-fill ${tone}`}
            cx={center} cy={center} r={radius}
            strokeDasharray={`${fill} ${circumference - fill}`}
          />
        </svg>
        <div className="circle-val">
          <span className="circle-num">{percent ?? "—"}%</span>
          <span className="circle-lbl-sm">{label}</span>
        </div>
      </div>
      <div className="ring-label">{sub}</div>
    </div>
  );
}
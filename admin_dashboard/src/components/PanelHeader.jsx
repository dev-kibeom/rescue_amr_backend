export default function PanelHeader({ title, tone, action }) {
  return (
    <div className="panel-header">
      <span className="panel-title">
        <span className={`dot ${tone}`} />
        {title}
      </span>
      {action}
    </div>
  );
}
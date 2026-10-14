export default function ProgressBar({ done, total, label, detail }: { done: number; total: number; label?: string; detail?: string }) {
  const percent = total ? Math.round(done / total * 100) : 0;
  return <div className="progress">
    {(label || detail) && <div className="progress-label"><span>{label ?? <><b>{done}</b> of {total} done</>}</span>{detail && <span>{detail}</span>}</div>}
    <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={label ?? `${done} of ${total} done`}>
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  </div>;
}

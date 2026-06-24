"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Modal } from "@/components/ui/modal";
import { Badge, Spinner } from "@/components/ui/card";
import {
  RATING_TREND_LABELS,
  RATING_TREND_TONES,
  useRatingStudent,
  type RatingSeriesPoint,
} from "@/lib/api/students-rating";

interface Props {
  studentId: string | null;
  onClose: () => void;
}

export function RatingStudentModal({ studentId, onClose }: Props) {
  const { data, isLoading } = useRatingStudent(studentId);

  return (
    <Modal open={Boolean(studentId)} onClose={onClose} title={data?.studentName ?? "O‘quvchi reytingi"} size="lg">
      {isLoading || !data ? (
        <div className="grid place-items-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sarlavha: avatar + ism + rozetkalar */}
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber/15 text-sm font-semibold text-amber">
              {data.initials ?? "—"}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-ink">{data.studentName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {data.classLabel && <Badge tone="accent">{data.classLabel}-sinf</Badge>}
                <Badge tone="neutral">#{data.rank}-o‘rin</Badge>
                <Badge tone="neutral">{data.level}</Badge>
              </div>
            </div>
          </div>

          {/* 3 ta stat */}
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Umumiy ball" value={data.umumiyBall} tone="text-ink" />
            <MiniStat label="O‘rtacha ball" value={data.ortachaBall} tone="text-negative" />
            <MiniStat label="Davomat" value={`${data.davomat}%`} tone="text-positive" />
          </div>

          {/* Dars baholari (oylik o'rtacha) + trend */}
          <Section
            title="Dars baholari (oylik o‘rtacha)"
            badge={
              <Badge tone={RATING_TREND_TONES[data.trend]}>{RATING_TREND_LABELS[data.trend]}</Badge>
            }
          >
            <SeriesChart data={data.darsBaholariOylik} domain={[0, 5]} stroke="var(--color-amber, #d97706)" />
          </Section>

          {/* Choraklik baholar */}
          <Section title="Choraklik baholar">
            {data.choraklikBaholar.length === 0 ? (
              <p className="py-4 text-sm text-ink-muted">Ma'lumot yo'q</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.choraklikBaholar.map((q, i) => (
                  <div key={`${q.quarterNumber}-${q.subjectName}-${i}`} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                    <span className="text-ink-muted">
                      {q.quarterNumber}-chorak · {q.subjectName}
                    </span>
                    <span className="font-semibold text-ink tnum">{q.grade ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Progress test */}
          <Section title="Progress test">
            <SeriesChart data={data.progressTest} domain={[0, 100]} stroke="var(--color-sky, #0284c7)" />
          </Section>
        </div>
      )}
    </Modal>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-xl border border-line bg-parchment/50 p-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold tnum ${tone}`}>{value}</p>
    </div>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h4>
        {badge}
      </div>
      {children}
    </div>
  );
}

function SeriesChart({ data, domain, stroke }: { data: RatingSeriesPoint[]; domain: [number, number]; stroke: string }) {
  if (data.length === 0) {
    return <p className="py-4 text-sm text-ink-muted">Ma'lumot yo'q</p>;
  }
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-line" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-muted" />
          <YAxis domain={domain} tick={{ fontSize: 11 }} stroke="currentColor" className="text-ink-muted" allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

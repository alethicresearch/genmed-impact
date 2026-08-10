import { AllData, fmtCompact, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Reading, PH, Lead, Claim, ClaimChain } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// The normative payoff of the analysis: what the quantitative results do and do not support,
// and the proposed sequencing for research and regulation. Everything on this page is labeled
// as interpretation or policy — the numbers it rests on are established in earlier sections.
export default function EthicsPolicy({ data, update }: Props) {
  const editableShare = data.summary.uniquely_editable_share_of_serious;
  const editableTotal = data.summary.uniquely_editable_total;
  const s1 = data.summary.s1_total;

  return (
    <Reading>
      <p className="text-[15px] leading-7 text-slate-600">
        The impact analysis points to <strong>three priorities operating on different time
        horizons</strong>.
      </p>
      <p className="text-[15px] leading-7 text-slate-600">
        First, established genetic medicine can produce substantial benefit now, and much of
        that impact remains unrealized because access and implementation are incomplete.
      </p>
      <p className="text-[15px] leading-7 text-slate-600">
        Second, a much smaller group of severe monogenic cases may already provide a strong
        medical rationale for developing germline editing because embryo selection cannot
        achieve the desired outcome.
      </p>
      <p className="text-[15px] leading-7 text-slate-600">
        Third, the future role of editing may expand substantially if polygenic causal
        inference and multiplex editing mature. That possibility justifies serious research and
        governance work now, even though present technology is not ready for those
        applications.
      </p>

      <section className="space-y-3">
        <PH>A principle of proportionality</PH>
        <Lead>
          We use a proportionality approach: the stronger the medical need and the weaker the
          reasonable alternatives, the stronger the case for considering germline-editing
          research. As effective alternatives become available — or as the goal moves away from
          treating serious disease — the burden of justification increases.
        </Lead>
        <Lead>
          Proportionality is therefore dynamic. The balance of benefit, alternatives, and risk
          can change as technologies mature. A use that is poorly justified today may become
          more defensible if technical performance and expected medical benefit change;
          conversely, the emergence of safer alternatives can weaken the case for germline
          intervention.
        </Lead>
        <Lead>
          This does not answer the independent safety question. A strong medical justification
          does not make an intervention ready for clinical use.
        </Lead>
      </section>

      <section className="space-y-3">
        <PH>From the evidence to a policy position</PH>
        <ClaimChain>
          <Claim kind="model">
            Under current-evidence assumptions, only about{' '}
            {fmtPct(editableShare.strict.median, 1)} of the modeled serious-disease burden falls
            within the editing-relevant residual (about{' '}
            {fmtCompact(editableTotal.strict.median)} births a year), dominated by approximately{' '}
            {fmtCompact(s1.median)} births/year in reproductive configurations where no
            unaffected embryo can be selected.
          </Claim>
          <Claim kind="interpretation">
            Germline editing therefore does not appear necessary as a broad population strategy
            for serious genetic disease. Its clearest potential medical role lies instead in the
            narrow situations where existing reproductive prevention cannot produce the same
            outcome.
          </Claim>
          <Claim kind="policy">
            We propose three parallel priorities. <strong>1. Scale present impact:</strong>{' '}
            expand access to established screening, reproductive, diagnostic, and therapeutic
            pathways where they already provide substantial benefit.{' '}
            <strong>2. Develop the justified frontier:</strong> create a transparent, tightly
            governed research pathway for severe germline-editing indications in which existing
            reproductive options cannot achieve the same medically important outcome, subject
            to independent safety and evidence requirements.{' '}
            <strong>3. Prepare for future impact:</strong> support rigorous research into
            causal genomics, polygenic intervention, multiplex editing, pleiotropy, embryo
            technologies, and long-term governance so that future applications can be evaluated
            before technological capability outruns public institutions.
          </Claim>
        </ClaimChain>
      </section>

      <section className="space-y-3">
        <PH>A proportional hierarchy for regulatory consideration</PH>
        <Lead>
          The categories below are ordered by the strength of their ethical case, from strongest
          to weakest. This is a <strong>proposed order for regulatory consideration</strong> —
          each step requiring stronger evidence and justification than the last — not a
          biological continuum, and not a prediction that later steps should ever be taken.{' '}
          <strong>
            The sequence ranks medical and ethical justification. It does not override
            independent scientific-safety gates.
          </strong>
        </Lead>
        <Sequence
          items={[
            {
              title: 'Severe monogenic disease with no unaffected embryo available',
              body: 'The strongest medical case. The condition is serious and embryo selection cannot achieve the desired preventive outcome. Consideration still depends on independent evidence of technical safety and clinical readiness.',
              go: () => update({ tab: 'residual' }),
              goLabel: 'When embryo selection is not enough',
            },
            {
              title: 'Severe monogenic disease with poor embryo-selection prospects',
              body: 'An unaffected embryo may be possible but difficult to obtain. Editing would need to demonstrate meaningful advantage over additional IVF/PGT cycles and other reproductive options.',
              go: () => update({ tab: 'embryos' }),
              goLabel: 'Selection vs editing',
            },
            {
              title: 'Complex and polygenic disease',
              body: 'A potentially important future domain rather than a current clinical indication. Its justification strengthens as causal confidence, multiplex-editing capacity, effect predictability, and safety improve, and where editing can demonstrate substantial benefit beyond embryo selection, prevention, treatment, and somatic approaches. Research into this frontier is justified before clinical readiness; clinical use is not.',
              go: () => update({ tab: 'multifactorial' }),
              goLabel: 'Complex disease',
            },
            {
              title: 'Resistance to common risks',
              body: 'Editing an otherwise healthy embryo to reduce future infection or disease risk requires its own comparison with existing preventive and therapeutic options.',
              go: () => update({ tab: 'beyond' }),
              goLabel: 'Resistance & enhancement',
            },
            {
              title: 'Enhancement',
              body: 'Altering traits beyond the disease-prevention framework raises a different set of questions about benefit, autonomy, fairness, distribution, and social effects.',
              go: () => update({ tab: 'beyond' }),
              goLabel: 'Resistance & enhancement',
            },
          ]}
        />
      </section>

    </Reading>
  );
}

function Sequence({
  items,
}: {
  items: { title: string; body: string; go: () => void; goLabel: string }[];
}) {
  return (
    <ol className="space-y-2">
      {items.map((it, i) => (
        <li key={it.title} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white"
          >
            {i + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{it.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{it.body}</p>
            <button
              type="button"
              onClick={it.go}
              className="mt-1.5 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {it.goLabel} →
            </button>
          </div>
        </li>
      ))}
    </ol>
  );
}

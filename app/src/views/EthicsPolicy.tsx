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
        The results point in two directions at once. At the population level, most modeled
        serious genetic-disease burden does not require germline editing, and the larger
        immediate opportunity is to expand access to screening, reproductive care, diagnosis,
        and treatment that already exist.
      </p>
      <p className="text-[15px] leading-7 text-slate-600">
        At the same time, a much smaller group of families may have no unaffected embryo
        available for selection. For them, germline editing could in principle offer something
        medically different rather than merely another route to the same outcome.
      </p>
      <p className="text-[15px] leading-7 text-slate-600">
        The ethical question is therefore not simply whether germline editing is “for” or
        “against” disease prevention. It is when the additional benefit is large enough, and
        the alternatives poor enough, to justify considering the additional risks of a
        heritable intervention.
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
            We therefore propose two parallel priorities: expand access to existing genetic
            medicine at population scale, while maintaining a tightly governed pathway for
            research on severe no-alternative cases if independent requirements for safety,
            evidence, consent, oversight, and long-term follow-up can be satisfied.
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
              title: 'Complex disease',
              body: 'Editing is not an only-option intervention. Any future case would require evidence that it provides substantial benefit beyond selection, prevention, treatment, and somatic approaches.',
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

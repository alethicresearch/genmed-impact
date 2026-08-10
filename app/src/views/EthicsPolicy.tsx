import { AllData, fmtCompact, fmtPct } from '../data';
import { UrlState } from '../urlState';
import { Reading, PH, Lead, Claim, ClaimChain, InlineLink } from '../components/prose';

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
  const cur = data.prevention['Global']?.['current']?.['monogenic']?.['pnd_on'];
  const ach = data.prevention['Global']?.['achievable_2035']?.['monogenic']?.['pnd_on'];
  const ideal = data.prevention['Global']?.['ideal']?.['monogenic']?.['pnd_on'];

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Selection-First</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              When embryo selection can achieve the same medically important reproductive
              outcome with substantially lower risk and acceptable reproductive burden,
              editing should have to demonstrate why it is preferable.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Somatic-First</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              When treatment of the future person can provide comparable benefit without
              making a heritable change, germline intervention should require additional
              justification.
            </p>
          </div>
        </div>
        <Lead>
          These are <strong>rebuttable presumptions, not prohibitions</strong>. Selection may
          be impossible or unusually burdensome; somatic treatment may be less effective,
          lifelong, inaccessible, or too late to prevent irreversible disease. In such cases
          the presumption can be overcome by evidence.
        </Lead>
      </section>

      <section className="space-y-3">
        <PH>The same outcome does not make the pathways morally equivalent</PH>
        <Lead>
          Carrier screening, PGT-M, prenatal diagnosis, newborn screening, somatic treatment,
          and germline correction can sometimes be compared using a common disease outcome,
          but they achieve that outcome in different ways — with different reproductive
          burdens and different moral profiles.
        </Lead>
        <Lead>
          Carrier screening can support reproductive planning without IVF. PGT-M requires IVF,
          embryo creation, testing, and selection. Prenatal diagnosis changes affected-birth
          numbers only when followed by a subsequent reproductive decision. Newborn screening
          accepts the birth of the child and seeks to reduce later disease. Somatic treatment
          acts on the affected or at-risk person. Germline correction alters the embryo and
          potentially descendants.
        </Lead>
        <Claim kind="interpretation">
          Quantitative comparability does not imply moral equivalence.
          {cur && ach && ideal ? (
            <>
              {' '}
              The coverage scenarios reported in this project —{' '}
              <InlineLink onClick={() => update({ tab: 'prevention' })}>
                roughly {fmtPct(cur.total_averted_birth_fraction.median, 0)} of monogenic
                affected births avoided at current coverage,{' '}
                {fmtPct(ach.total_averted_birth_fraction.median, 0)} under expanded access,
                and {fmtPct(ideal.total_averted_birth_fraction.median, 1)} under idealized
                full coverage
              </InlineLink>{' '}
              — are model results about achievable affected-birth avoidance. They are
              not rankings of moral desirability, and greater affected-birth avoidance is not
              automatically ethically better.
            </>
          ) : null}
        </Claim>
      </section>

      <section className="space-y-3">
        <PH>From the evidence to a policy position</PH>
        <ClaimChain>
          <Claim kind="model">
            Under current-evidence assumptions, only about{' '}
            <InlineLink onClick={() => update({ tab: 'residual' })}>
              {fmtPct(editableShare.strict.median, 1)} of the modeled serious-disease burden
            </InlineLink>{' '}
            falls within the editing-relevant residual (about{' '}
            {fmtCompact(editableTotal.strict.median)} births a year), dominated by approximately{' '}
            <InlineLink onClick={() => update({ tab: 'residual' })}>
              {fmtCompact(s1.median)} births/year
            </InlineLink>{' '}
            in reproductive configurations where no unaffected embryo can be selected.
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

      <section className="space-y-3">
        <PH>Three ways premature use damages the field</PH>
        <Lead>
          Why does the sequencing above matter? Because misuse of germline editing tends to
          take three related but distinct forms, each of which can set back genuinely
          justified applications.
        </Lead>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Spectacle</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Highly visible premature applications can dominate public perception far beyond
              the number of people they affect. Visible failures can strengthen pressure for
              broad prohibition and risk diverting attention from both established medicine
              and carefully governed research.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Regulatory arbitrage</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              When credible pathways are unavailable elsewhere, research can move toward
              jurisdictions with weaker or less settled oversight. A transparent, tightly
              governed pathway for the strongest indications reduces the incentive to seek
              the weakest regulator.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Ethical arbitrage</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              The moral urgency of a strongly justified use can be borrowed to support another
              application with a weaker benefit-to-risk case. A compelling argument for
              correcting a lethal monogenic disorder does not automatically justify CCR5
              resistance editing, modest polygenic risk reduction, or enhancement.
            </p>
          </div>
        </div>
        <Claim kind="interpretation">
          The proportional hierarchy is designed to resist all three: it evaluates each
          application on its own medical need, alternatives, and evidence, rather than letting
          the strongest case carry the weakest.
        </Claim>
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

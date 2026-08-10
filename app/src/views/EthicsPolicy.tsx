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
        The empirical model does not determine policy. We interpret the results using a
        principle of proportionality: the case for a heritable intervention is strongest when
        the condition is serious, expected benefit is substantial, and reasonable alternatives
        cannot achieve the same medically important outcome with lower risk or burden.
      </p>

      <section className="space-y-3">
        <PH>Why the framing matters</PH>
        <Lead>
          Debate over germline editing has often been organized around high-profile
          technological firsts or general claims about preventing genetic disease. Our analysis
          suggests a more discriminating approach: compare medical need, available alternatives,
          incremental benefit, and safety for each proposed use.
        </Lead>
      </section>

      <section className="space-y-3">
        <PH>What the numbers do and do not say</PH>
        <Lead>The central chain of reasoning, with each link labeled:</Lead>
        <ClaimChain>
          <Claim kind="model">
            Under current evidence, the editing-relevant residual is roughly{' '}
            {fmtPct(editableShare.strict.median, 1)} of modeled serious genetic disease (about{' '}
            {fmtCompact(editableTotal.strict.median)} births a year, dominated by the ~
            {fmtCompact(s1.median)} families for whom no unaffected embryo can be selected — the
            editing-only prevention population). Under the optimistic complex-disease scenario,
            which additionally credits editing with a hypothesized advantage in a few complex
            diseases, that rises to about {fmtPct(editableShare.permissive.median, 1)}.
          </Claim>
          <Claim kind="interpretation">
            Under the modeled scenarios, germline editing is not the principal population-level
            tool for reducing serious genetic-disease burden — but the editing-only prevention
            population, though narrow, is real, identifiable, and poorly served by every
            existing option, and the complex-disease term is a modeled possibility rather than a
            second “only option” population.
          </Claim>
          <Claim kind="policy">
            This supports giving public-health priority to widening access to existing
            genetic-medicine pathways, which carry most of the achievable benefit. At the same
            time, the editing-only prevention cases are where a tightly governed clinical
            research pathway is best justified — which suggests replacing blanket moratorium
            logic with regulation that distinguishes cases by their justification, subject to
            the independent safety requirements below.
          </Claim>
        </ClaimChain>
        <Lead>
          To be explicit about what is <em>not</em> being argued: the conclusion is not “embryo
          editing is unnecessary because existing tools cover almost everything.” It is that
          existing medicine should carry the population-level burden, while the narrow situations
          in which editing would be the only preventive option are exactly where a responsible
          regulatory pathway should begin.
        </Lead>
      </section>

      <section className="space-y-3">
        <PH>A proposed sequencing for research and regulation</PH>
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
              title: 'Catastrophic monogenic disease',
              body: 'Conditions that are fatal or profoundly disabling, in families where no unaffected embryo can be selected. This is the strongest candidate class for first-in-human regulatory consideration because medical need is high and alternatives are absent. That does not by itself establish readiness for a trial: independent requirements for editing accuracy, mosaicism, off-target and on-target safety, developmental effects, preclinical evidence, consent, long-term and intergenerational follow-up, and regulatory oversight must also be satisfied.',
              go: () => update({ tab: 'residual' }),
              goLabel: 'The editing-only families',
            },
            {
              title: 'Severe monogenic disease',
              body: 'Serious but survivable single-gene conditions. Here selection is usually available, so editing must additionally justify itself against a working alternative — for example on the embryo-loss grounds examined in the trade-offs section.',
              go: () => update({ tab: 'embryos' }),
              goLabel: 'The embryo trade-off',
            },
            {
              title: 'Complex (multifactorial) disease',
              body: 'A potential future role only, contingent on genetic architecture and on evidence that editing outperforms selection, drugs, and prevention. On current evidence no complex disease clears the bar; a small number could under optimistic assumptions.',
              go: () => update({ tab: 'multifactorial' }),
              goLabel: 'Could editing help complex disease?',
            },
            {
              title: 'Resistance to common risks',
              body: 'Editing healthy genomes to blunt infection or cardiovascular risk. Alternatives already exist and are not exhausted; the disease-prevention justification does not apply.',
              go: () => update({ tab: 'beyond' }),
              goLabel: 'Beyond disease prevention',
            },
            {
              title: 'Enhancement',
              body: 'Raising traits beyond the typical range. Outside the disease-prevention question analyzed here; to be argued on its own terms in a separate debate about advantage and fairness.',
              go: () => update({ tab: 'beyond' }),
              goLabel: 'Beyond disease prevention',
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

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
        The earlier sections establish how much serious genetic disease there is, how much of it
        existing medicine can already reach, and where germline editing would add an option
        nothing else provides. This page states what the authors think should follow — for
        research priorities and for regulation. Unlike the model results, these are normative
        positions, and they are labeled as such.
      </p>

      <section className="space-y-3">
        <PH>Why the framing matters</PH>
        <Lead>
          Germline editing has so far entered public life mainly through spectacle: announced
          “firsts” conducted outside ordinary oversight, ventures locating themselves where
          regulation is weakest, and claims about preventing disease stretched well past what the
          epidemiology supports. Each episode makes the environment worse for responsible work —
          regulators respond to scandal with blanket prohibition, and the narrow cases where
          editing could genuinely help are left with no lawful path at all.
        </Lead>
        <Lead>
          Exaggerated disease-prevention claims do specific damage. If embryo editing is
          presented as the answer to genetic disease at large, it borrows an urgency the numbers
          do not support — most of that burden is already reachable by other means — and it
          crowds out the unglamorous work of extending screening and treatment to the people who
          lack them. A quantitative map of what medicine can already do is, among other things, a
          defense against that kind of ethical arbitrage.
        </Lead>
      </section>

      <section className="space-y-3">
        <PH>What the numbers do and do not say</PH>
        <Lead>The central chain of reasoning, with each link labeled:</Lead>
        <ClaimChain>
          <Claim kind="model">
            Under the current-evidence definition of the editing-only population, roughly{' '}
            {fmtPct(editableShare.strict.median, 1)} of modeled serious genetic disease (about{' '}
            {fmtCompact(editableTotal.strict.median)} births a year, dominated by the ~
            {fmtCompact(s1.median)} families for whom no unaffected embryo can be selected) is
            uniquely reachable by germline editing. Under the optimistic upper-bound definition,
            which credits a future role in complex disease, that rises to about{' '}
            {fmtPct(editableShare.permissive.median, 1)}.
          </Claim>
          <Claim kind="interpretation">
            Germline editing is therefore unlikely ever to be the principal population-level tool
            against genetic disease — but the editing-only population, though narrow, is real,
            identifiable, and poorly served by every existing option.
          </Claim>
          <Claim kind="policy">
            Public-health priority should go to widening access to existing genetic-medicine
            pathways, which carry most of the achievable benefit. At the same time, the
            editing-only cases are precisely where a tightly governed clinical research pathway
            is best justified — which argues for replacing blanket moratorium logic with
            regulation that distinguishes cases by their justification.
          </Claim>
        </ClaimChain>
        <Lead>
          To be explicit about what is <em>not</em> being argued: the conclusion is not “embryo
          editing is unnecessary because existing tools cover almost everything.” It is that
          existing medicine should carry the population-level burden, while the narrow situations
          in which editing offers a genuinely unique benefit are exactly where a responsible
          regulatory pathway should begin.
        </Lead>
      </section>

      <section className="space-y-3">
        <PH>A proposed sequencing for research and regulation</PH>
        <Lead>
          The categories below are ordered by the strength of their ethical case, from strongest
          to weakest. This is a <strong>proposed order for regulatory consideration</strong> —
          each step requiring stronger evidence and justification than the last — not a
          biological continuum, and not a prediction that later steps should ever be taken.
        </Lead>
        <Sequence
          items={[
            {
              title: 'Catastrophic monogenic disease',
              body: 'Conditions that are fatal or devastating in early life, in families where no unaffected embryo can be selected. The strongest case for first, tightly controlled clinical trials: an identifiable child spared a catastrophic disease, with no existing alternative.',
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
              body: 'Raising traits beyond the typical range. Not a medical question at all; to be argued on its own terms in a separate debate about advantage and fairness.',
              go: () => update({ tab: 'beyond' }),
              goLabel: 'Beyond disease prevention',
            },
          ]}
        />
      </section>

      <section className="space-y-3">
        <PH>The trade-offs examined in this section</PH>
        <Lead>
          Two supporting analyses sit alongside this argument. The{' '}
          <button
            type="button"
            onClick={() => update({ tab: 'embryos' })}
            className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            embryo trade-off
          </button>{' '}
          compares selection and correction on what each asks of the embryos involved — the one
          axis on which editing can be ethically preferable to selection. The{' '}
          <button
            type="button"
            onClick={() => update({ tab: 'allocation' })}
            className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            exploratory cost scenario
          </button>{' '}
          asks what investments at scale versus frontier R&amp;D each accomplish — with its
          inputs still provisional, it is presented as an exploration, not a paper result.
        </Lead>
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

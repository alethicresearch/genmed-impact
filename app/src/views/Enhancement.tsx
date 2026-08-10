import { AllData } from '../data';
import { UrlState } from '../urlState';
import { Reading, PH, Lead, Caption } from '../components/prose';

interface Props {
  data: AllData;
  state: UrlState;
  update: (patch: UrlState) => void;
}

// Enhancement — the far end of the correction → augmentation trajectory. Deliberately prose-led
// and honest: there is no disease-burden denominator here, and it is not one.
export default function Enhancement({ update }: Props) {
  return (
    <Reading>
      <p className="text-[15px] leading-7 text-slate-600">
        Enhancement means pushing a trait <em>beyond</em> the typical range — cognition, height,
        longevity — rather than preventing or curing disease. It is the far end of the correction →
        augmentation trajectory, and, some argue, the road toward “perfection.” The paper's position
        is that it must be judged on its own terms and cannot borrow the moral urgency of preventing
        disease.
      </p>

      <section className="space-y-3">
        <PH>Why it is a different question</PH>
        <Lead>
          Preventing serious disease removes suffering that would otherwise fall on a specific
          child. Enhancement, by contrast, redistributes advantage: its benefit is measured in
          relative standing, not in lives saved or catastrophe averted. The two invoke different
          ethics, and only the first carries the public-health justification that drives the rest of
          this analysis. Treating them as one lets enhancement smuggle in an urgency it has not
          earned.
        </Lead>
      </section>

      <section className="space-y-3">
        <PH>The disease-burden bridge — and where it breaks</PH>
        <Lead>
          There is a real continuum from disease to trait. On the{' '}
          <button
            type="button"
            onClick={() => update({ tab: 'multifactorial' })}
            className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            liability-threshold model
          </button>{' '}
          everyone carries a continuous genetic load and “disease” is simply the far tail past a
          threshold. That invites an argument: if we already act to lower risk across that
          continuum, moving the whole distribution — enhancing everyone — is just more of the same.
          The argument breaks at the threshold. The moral weight lives in preventing{' '}
          <em>serious disease</em>; beyond it, shifting a population's traits is a contested social
          project, not medicine. A continuum in biology is not a continuum in justification.
        </Lead>
      </section>

      <section className="space-y-3">
        <PH>Is it even feasible?</PH>
        <Lead>
          Separately from whether it is desirable, enhancement of complex traits is, on today's
          science, largely out of reach. The traits people have in mind are{' '}
          <strong>massively polygenic</strong> — thousands of tiny-effect variants — strongly
          environment-dependent, and predicted by scores whose accuracy does not transfer across
          ancestries. Editing a handful of loci cannot move such a trait far, and embryo selection
          is bounded by how few embryos an IVF cycle yields. The same viability ceiling that limits
          editing for common <em>disease</em> limits it far more for enhancement.
        </Lead>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => update({ tab: 'multifactorial' })}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            See the polygenicity ceiling →
          </button>
          <button
            type="button"
            onClick={() => update({ tab: 'resistance' })}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            ← Back to resistance
          </button>
        </div>
        <Caption>
          Genetic architecture of complex traits: Turkheimer 2000; Plomin &amp; von Stumm 2018.
          Cross-ancestry portability of polygenic scores: Martin et al. 2019.
        </Caption>
      </section>

      <section className="space-y-3">
        <PH>There is no birth-count denominator here</PH>
        <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4">
          <p className="text-sm leading-7 text-slate-700">
            Every other section of this analysis reduces to a number of affected births. Enhancement
            does not: there is no disease it prevents and no burden it averts. That absence is the
            point. It belongs to a separate debate about advantage, fairness, and what we owe future
            generations — assessed on those terms, not as a continuation of the case for preventing
            disease.
          </p>
        </div>
      </section>
    </Reading>
  );
}

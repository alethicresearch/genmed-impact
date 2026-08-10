"""CLI: `python -m denominator [run|ingest]`."""
from __future__ import annotations

import argparse
import sys

from . import config


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="denominator")
    sub = parser.add_subparsers(dest="cmd")

    p_run = sub.add_parser("run", help="run the full pipeline and export results")
    p_run.add_argument("--draws", type=int, default=config.N_DRAWS)
    p_run.add_argument("--seed", type=int, default=config.SEED)

    sub.add_parser("ingest", help="attempt Tier-A pulls; write DATA_NEEDED.md for the rest")

    args = parser.parse_args(argv)
    if args.cmd == "run" or args.cmd is None:
        from . import export, run as run_mod
        draws = getattr(args, "draws", config.N_DRAWS)
        seed = getattr(args, "seed", config.SEED)
        print(f"[denominator] running pipeline (draws={draws}, seed={seed}) ...")
        R = run_mod.run(n=draws, seed=seed)
        export.export_all(R)
        b = R["burden"]["default"]
        ed = R["residual"]["uniquely_editable_share_of_serious"]["permissive"]
        print(f"[denominator] serious genetic births/yr: {b['total_serious']['median']:,.0f} "
              f"(monogenic {b['monogenic']['median']:,.0f}, multifactorial {b['multifactorial']['median']:,.0f})")
        print(f"[denominator] uniquely editable (permissive): "
              f"{R['residual']['uniquely_editable_total']['permissive']['median']:,.0f} "
              f"({ed['median']*100:.2f}% of serious; addressable "
              f"{R['residual']['addressable_share_of_serious']['permissive']['median']*100:.1f}%)")
        print(f"[denominator] wrote app JSON -> {config.APP_DATA_DIR}")
        print(f"[denominator] wrote results -> {config.RESULTS_DIR}")
        return 0
    if args.cmd == "ingest":
        from .ingest import run_all
        run_all()
        return 0
    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())

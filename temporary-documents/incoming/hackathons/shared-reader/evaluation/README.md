# Larger offline reader evaluation

[Read the reviewed results](../../../../../hackathons/shared-reader/evaluation/runs/RESULTS.md). The complete case table is
[runs/report.md](../../../../../hackathons/shared-reader/evaluation/runs/report.md), with raw [JSON](../../../../../hackathons/shared-reader/evaluation/runs/summary.json).

This evaluation uses static local data only. It does not set up a CTF, deploy a
challenge, join a competition, scan a network target, execute downloaded sample
code, or authenticate with recovered credentials. Public downloads are upstream
regression fixtures from CPython, Pillow and qpdf, pinned by commit and SHA-256.
Their source licences are retained in `public-samples/`.

There are 255 files: 240 with stated test goals and 15 unmodified, unlabelled
public samples. The 240 include 8 public files augmented with a known appended
payload, 18 larger log/configuration probes, and generated file-format, hash,
encoding, negative-control and resource-limit fixtures. These are test inputs,
not deployed challenges. The encrypted SSH key is disposable fixture data and
was never installed or used to connect anywhere.

Each file runs in its own fresh project outside the live watched environment.
Production reader code and default processing limits remain unchanged. The
measured engine profile is used; a small explicit audit seed list limits cracking
work. Known answers are used by the evaluator and are never passed as plaintext
regexes. Do not read the recovery rates as a password-strength benchmark.

The first run has 237 files. The second adds 18 files between 16 KB and 1.9 MB;
it uses a stricter quiet-file oracle that refuses a pass after reader errors or
coverage limits. All 19 first-run negatives were separately checked to have
complete reader reports, so that refinement does not change their outcomes.

The runner pauses `hackathon-readers.service` while it owns the shared compute
lock and restores it in `finally`. Both measured runs restored it successfully.
It keeps native reports and errors. Reaching an idle queue does not imply that
every byte was examined: a candidate limit can leave incomplete coverage.

To rerun the frozen corpus, choose new result directories:

```bash
# From /home/joshua/Documents/ChatGPT/Hackathons
hash-watch/.venv/bin/python -m unittest discover \
  -s shared-reader/evaluation -p test_oracles.py -v
hash-watch/.venv/bin/python shared-reader/evaluation/run_evaluation.py \
  --out shared-reader/evaluation/runs/my-collection-run
hash-watch/.venv/bin/python shared-reader/evaluation/run_volume.py \
  --out shared-reader/evaluation/runs/my-volume-run
```

Do not rebuild or overwrite the measured corpus when reviewing historical
results. Inputs, exact goals, hashes, source URLs and a frozen harness copy are
under `runs/design/`. One requested CPython JSON URL returned 404; it is recorded
as an acquisition failure and excluded from the evaluated-file denominator.

Original public samples have no assumed hidden-content ground truth. Their
results are observations. The ordinary negative controls have narrower known
intent; extraction by itself is not called a false positive. The two unwanted
checksum cracking actions and partial coverage are reported separately.

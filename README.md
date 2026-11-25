# GCI World 2026 – Final Assignment: "Renew & Upgrade"

A churn-prevention business proposal for **Company A** (an anonymous wireless operator). It is built on EDA, a
LightGBM churn model and a quantified retention-campaign simulation.

**Ready to upload (Omnicampus account `RKRohan4231`):** `submission/RKRohan4231.pdf` (slides),
`submission/RKRohan4231.ipynb` (notebook), `submission/references.txt` (paste into the Reference URL field).

| Deliverable | Source file |
|---|---|
| Slides (PDF to submit, ≤15 pages) | `slides/Renew_and_Upgrade_Proposal.pdf` |
| Slides (editable) | `slides/Renew_and_Upgrade_Proposal.pptx` |
| Notebook (reproducible analysis) | `analysis/churn_analysis.ipynb` (source: `analysis/churn_analysis.py`) |
| List of references (for the Omnicampus field) | `references.txt` |


## Headline results
- **EDA:** churn peaks at **64% in months 11–12** of service (renewal cliff) and rises from **42% to 58%** as the handset ages.
- **Model:** LightGBM, **ROC-AUC ≈ 0.70** on a 20% hold-out test set. It beats Random Forest and Logistic Regression, and 5-fold CV agrees with the test score.
  The top-20% risk list churns at **≈74%**, against 49.6% on average.
- **Proposal:** monthly scoring, with targeted upgrade, renewal or plan offers to the riskiest 20%. Net value is **≈ +$0.8M per cycle per
  100k customers**, break-even at a ~9% save rate. Validate with a 3-month A/B pilot.

## Reproduce
The course dataset is not redistributed here. Place `Client.csv` and `Record.csv` in one of these locations:
`analysis/telecom/`, `telecom/` or `Final Assignment/Final Assignment/telecom/`.

```bash
pip install pandas numpy scikit-learn lightgbm shap matplotlib seaborn nbformat nbconvert
cd analysis
python py2nb.py churn_analysis.py churn_analysis.ipynb      # regenerate the notebook from source
jupyter nbconvert --to notebook --execute --inplace churn_analysis.ipynb   # writes figures/ and result CSVs
```

Rebuild the slides. This needs Node.js; the PDF export needs Microsoft PowerPoint on Windows.

```bash
cd slides
npm install pptxgenjs@3.12.0 react-icons@5.3.0 react@18.3.1 react-dom@18.3.1 sharp@0.33.5
node build_deck.js && python strip_dirs.py Renew_and_Upgrade_Proposal.pptx
pwsh ./export.ps1          # -> PDF + render/*.png
```

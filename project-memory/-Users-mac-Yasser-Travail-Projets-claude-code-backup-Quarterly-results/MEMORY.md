# Quarterly Results - Memory

## Project Setup
- **Venv required**: Use `./venv/bin/python3` (not `python` or `python3`) - Google API packages only in venv
- **macOS PEP 668**: Can't `pip install` system-wide, always use venv
- **importlib.metadata warning**: Non-blocking, ignore it on Google API calls

## Pipeline (4 steps)
- Step 0: `00_download_from_drive.py` - Download PDFs from Drive
- Step 1: `01_convert_pdfs.py` - PDF -> Markdown (LlamaParse + pdfplumber)
- Step 2: Manual via Claude Code - Extract/validate/format using `prompts/`
- Step 3: `05_upload_to_drive.py` - Upload results to Drive
- Orchestrator: `run_pipeline.py` supports `--quarter`, `--company`, `--steps`, `--all`

## Output Format
- Per company: `{company}_financial.json`, `{company}_strategic.json`, `{company}_financial.md`, `{company}_strategic.md`
- Path: `data/insights/<quarter>/<company>/`

## Q3 Data Quality Issues (Fixed in prompts)
- Duplicates in segments (6 entries for 3 segments) -> added dedup rules
- Proxy/AGM document noise (40 KPIs, 59 sector keys) -> added source filtering
- Too many items (30 takeaways, 23 initiatives) -> added max limits

## Q4 Amazon - Completed
- 3 PDFs: Earnings release, Webslides, 10-K annual report
- All 4 output files generated and uploaded to Drive

## Google Drive Structure
- Root folder ID in `.env` as `GDRIVE_ROOT_FOLDER_ID`
- Structure: `Drive/<quarter>/<company>/` (PDFs + insights side by side)
- Auth: OAuth2 with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`

## Companies (12)
Amazon, LVMH, NVIDIA, Wayfair, Constellation Software, Shopify, eBay, Coinbase, Circle, Etsy, YETI, FIGS

# ClearCut — Free AI Background Remover

A simple background-removal web app using vanilla HTML/CSS/JavaScript, Flask, Pillow, and the open-source `rembg` U²-Net model.

## Requirements
- Python 3.10–3.12 recommended
- Internet access for the first model download
- About 1–2 GB free disk space recommended for dependencies and model files

## Run on Windows

Open PowerShell in this project folder:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

If PowerShell blocks activation, run the commands below instead:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Then open http://127.0.0.1:5000 in your browser.

The first background-removal request downloads/loads the model and may take longer than later requests.

## Notes
- Upload limit: 15 MB; maximum 25 megapixels.
- Supported input: PNG, JPG/JPEG, WebP.
- Output: transparent PNG.
- Images are processed by your local Flask server. This starter app does not save uploaded images to a database.
- Do not deploy Flask's development server directly to the public internet. For public hosting, configure a production WSGI server, upload limits, rate limiting, and suitable compute resources.
- `rembg` and its model are open-source; check the upstream project/model licenses and hosting provider limits before commercial use.

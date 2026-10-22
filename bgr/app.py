from flask import Flask, render_template, request, send_file, jsonify
from rembg import remove, new_session
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import os

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 15 * 1024 * 1024  # 15 MB upload limit
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

# Model is loaded once and reused between requests.
_session = None

def get_session():
    global _session
    if _session is None:
        _session = new_session("u2net")
    return _session

@app.get("/")
def index():
    return render_template("index.html")

@app.post("/api/remove-background")
def remove_background():
    upload = request.files.get("image")
    if not upload or not upload.filename:
        return jsonify({"error": "Choose an image first."}), 400

    ext = upload.filename.rsplit(".", 1)[-1].lower() if "." in upload.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Please upload a PNG, JPG, JPEG, or WebP image."}), 400

    try:
        source = Image.open(upload.stream)
        source.load()
        if source.width * source.height > 25_000_000:
            return jsonify({"error": "Image is too large. Please use an image under 25 megapixels."}), 400
        source = source.convert("RGBA")
        result = remove(source, session=get_session())
        output = BytesIO()
        result.save(output, format="PNG", optimize=True)
        output.seek(0)
        return send_file(
            output,
            mimetype="image/png",
            as_attachment=True,
            download_name="background-removed.png"
        )
    except UnidentifiedImageError:
        return jsonify({"error": "That file doesn't appear to be a valid image."}), 400
    except Exception as exc:
        app.logger.exception("Background removal failed")
        return jsonify({"error": "Processing failed. Check the server terminal for details, then try again."}), 500

@app.errorhandler(413)
def too_large(_error):
    return jsonify({"error": "File is too large. Maximum upload size is 15 MB."}), 413

if __name__ == "__main__":
    app.run(debug=True)

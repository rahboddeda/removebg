import os

# Vercel's filesystem is read-only except for temporary storage.
# rembg/pooch uses U2NET_HOME for downloaded model files.
os.environ["U2NET_HOME"] = "/tmp/.u2net"

from flask import Flask, render_template, request, send_file, jsonify
from rembg import remove, new_session
from PIL import Image, UnidentifiedImageError
from io import BytesIO

app = Flask(__name__)

# Keep uploads below Vercel's 4.5 MB request-body limit.
# Multipart form overhead also counts toward that limit.
app.config["MAX_CONTENT_LENGTH"] = int(15 * 1024 * 1024)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

# Reuse the model session when a serverless instance remains warm.
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
            return jsonify({
                "error": "Image is too large. Please use an image under 25 megapixels."
            }), 400

        source = source.convert("RGBA")
        result = remove(source, session=get_session())

        output = BytesIO()
        result.save(output, format="PNG", optimize=True)
        output.seek(0)

        return send_file(
            output,
            mimetype="image/png",
            as_attachment=True,
            download_name="background-removed.png",
        )

    except UnidentifiedImageError:
        return jsonify({"error": "That file doesn't appear to be a valid image."}), 400
    except Exception:
        app.logger.exception("Background removal failed")
        return jsonify({
            "error": "Background removal failed on the server. Please try again with a smaller image."
        }), 500


@app.errorhandler(413)
def too_large(_error):
    return jsonify({
        "error": "File is too large. Please upload an image smaller than 3.5 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True)

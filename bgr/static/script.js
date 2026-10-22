const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const removeBtn = document.getElementById("removeBtn");
const selectedFile = document.getElementById("selectedFile");
const errorBox = document.getElementById("errorBox");
const progressArea = document.getElementById("progressArea");
const resultArea = document.getElementById("resultArea");
const originalPreview = document.getElementById("originalPreview");
const resultPreview = document.getElementById("resultPreview");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const progressText = document.getElementById("progressText");

let chosenFile = null;
let originalUrl = null;
let resultUrl = null;

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}
function clearOldUrls() {
  if (originalUrl) URL.revokeObjectURL(originalUrl);
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  originalUrl = null;
  resultUrl = null;
}
function chooseFile(file) {
  showError("");
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    showError("Please choose a PNG, JPG, or WebP image.");
    return;
  }
  if (file.size > 3.9 * 1024 * 1024) {
    showError("This file is larger than 3.9 MB. Please choose a smaller image.");
    return;
  }
  clearOldUrls();
  chosenFile = file;
  originalUrl = URL.createObjectURL(file);
  originalPreview.src = originalUrl;
  selectedFile.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  selectedFile.hidden = false;
  removeBtn.disabled = false;
  resultArea.hidden = true;
}
dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener("change", () => chooseFile(fileInput.files[0]));
["dragenter", "dragover"].forEach(type => dropzone.addEventListener(type, event => {
  event.preventDefault(); dropzone.classList.add("dragover");
}));
["dragleave", "drop"].forEach(type => dropzone.addEventListener(type, event => {
  event.preventDefault(); dropzone.classList.remove("dragover");
}));
dropzone.addEventListener("drop", event => chooseFile(event.dataTransfer.files[0]));

removeBtn.addEventListener("click", async () => {
  if (!chosenFile) return;
  showError("");
  progressArea.hidden = false;
  resultArea.hidden = true;
  removeBtn.disabled = true;
  progressText.textContent = "Removing the background…";
  const body = new FormData();
  body.append("image", chosenFile);
  try {
    const response = await fetch("/api/remove-background", { method: "POST", body });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      let message = "Could not process this image.";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        message = data.error || message;
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    if (!blob.type.includes("image/png")) throw new Error("The server returned an unexpected file.");
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    resultPreview.src = resultUrl;
    resultArea.hidden = false;
    progressText.textContent = "All done!";
  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
  } finally {
    progressArea.hidden = true;
    removeBtn.disabled = !chosenFile;
  }
});

downloadBtn.addEventListener("click", () => {
  if (!resultUrl) return;
  const link = document.createElement("a");
  link.href = resultUrl;
  link.download = "clearcut-background-removed.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
});

resetBtn.addEventListener("click", () => {
  clearOldUrls();
  chosenFile = null;
  fileInput.value = "";
  selectedFile.hidden = true;
  selectedFile.textContent = "";
  resultArea.hidden = true;
  progressArea.hidden = true;
  removeBtn.disabled = true;
  showError("");
  originalPreview.removeAttribute("src");
  resultPreview.removeAttribute("src");
  dropzone.focus();
});
window.addEventListener("beforeunload", clearOldUrls);

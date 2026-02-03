import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "fileInput",
    "uploadCard",
    "loadingCard",
    "uploadSection",
    "resultsSection",
    "errorBox",
    "errorMessage",
    "previewHighContrast",
    "previewFlatGray",
    "spinnerHighContrast",
    "spinnerFlatGray",
    "downloadHighContrast",
    "downloadFlatGray",
    "formHighContrast",
    "formFlatGray"
  ]

  connect() {
    // Store blob URLs for cleanup
    this.blobUrls = []
    // Store the selected file
    this.selectedFile = null
  }

  disconnect() {
    // Clean up blob URLs when controller disconnects
    this.revokeBlobUrls()
  }

  // Trigger file input click
  triggerFileSelect(event) {
    event.preventDefault()
    this.fileInputTarget.click()
  }

  // Handle file selection from input
  handleFileSelect(event) {
    const file = event.target.files[0]
    if (file) {
      this.processFile(file)
    }
  }

  // Drag and drop handlers
  handleDragEnter(event) {
    event.preventDefault()
    this.uploadCardTarget.classList.add("dropzone-active")
  }

  handleDragOver(event) {
    event.preventDefault()
  }

  handleDragLeave(event) {
    event.preventDefault()
    this.uploadCardTarget.classList.remove("dropzone-active")
  }

  handleDrop(event) {
    event.preventDefault()
    this.uploadCardTarget.classList.remove("dropzone-active")

    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      this.processFile(file)
    } else {
      this.showError("Bitte wähle eine Bilddatei aus.")
    }
  }

  // Main processing flow
  async processFile(file) {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showError(`Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB).`)
      return
    }

    // Store the file for download forms
    this.selectedFile = file

    // Show loading state
    this.hideError()
    this.uploadCardTarget.classList.add("d-none")
    this.loadingCardTarget.classList.remove("d-none")

    try {
      // Fetch previews sequentially to avoid race conditions in libvips
      // Parallel requests can cause SIGSEGV due to thread-safety issues
      const highContrastBlob = await this.fetchPreview(file, "high_contrast")
      this.displayPreview(highContrastBlob, "highContrast")

      const flatGrayBlob = await this.fetchPreview(file, "flat_gray")
      this.displayPreview(flatGrayBlob, "flatGray")

      // Attach file to download forms
      this.attachFileToForm(this.formHighContrastTarget, file)
      this.attachFileToForm(this.formFlatGrayTarget, file)

      // Enable download buttons
      this.downloadHighContrastTarget.disabled = false
      this.downloadFlatGrayTarget.disabled = false

      // Show results
      this.uploadSectionTarget.classList.add("d-none")
      this.resultsSectionTarget.classList.remove("d-none")

    } catch (error) {
      console.error("Processing error:", error)
      this.showError(error.message || "Bildverarbeitung fehlgeschlagen.")
      this.uploadCardTarget.classList.remove("d-none")
      this.loadingCardTarget.classList.add("d-none")
    }
  }

  // Fetch preview from server as blob
  async fetchPreview(file, variant) {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("variant", variant)

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content

    const response = await fetch("/preview", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfToken
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || "Vorschau konnte nicht geladen werden.")
    }

    return await response.blob()
  }

  // Display preview using blob URL
  displayPreview(blob, variant) {
    const blobUrl = URL.createObjectURL(blob)
    this.blobUrls.push(blobUrl)

    if (variant === "highContrast") {
      this.previewHighContrastTarget.src = blobUrl
      this.previewHighContrastTarget.classList.remove("d-none")
      this.spinnerHighContrastTarget.classList.add("d-none")
    } else {
      this.previewFlatGrayTarget.src = blobUrl
      this.previewFlatGrayTarget.classList.remove("d-none")
      this.spinnerFlatGrayTarget.classList.add("d-none")
    }
  }

  // Attach file to a form for download
  attachFileToForm(form, file) {
    // Remove any existing file input
    const existingInput = form.querySelector('input[name="image"]')
    if (existingInput) {
      existingInput.remove()
    }

    // Create a new file input with the file
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)

    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.name = "image"
    fileInput.style.display = "none"
    fileInput.files = dataTransfer.files

    form.appendChild(fileInput)
  }

  // Reset to initial state
  reset(event) {
    if (event) event.preventDefault()

    // Dispatch reset event for histogram controllers
    this.dispatch("reset")

    // Revoke blob URLs to free memory
    this.revokeBlobUrls()

    // Reset file input
    this.fileInputTarget.value = ""
    this.selectedFile = null

    // Hide previews, show spinners
    this.previewHighContrastTarget.classList.add("d-none")
    this.previewHighContrastTarget.src = ""
    this.spinnerHighContrastTarget.classList.remove("d-none")

    this.previewFlatGrayTarget.classList.add("d-none")
    this.previewFlatGrayTarget.src = ""
    this.spinnerFlatGrayTarget.classList.remove("d-none")

    // Disable download buttons
    this.downloadHighContrastTarget.disabled = true
    this.downloadFlatGrayTarget.disabled = true

    // Show upload section
    this.resultsSectionTarget.classList.add("d-none")
    this.uploadSectionTarget.classList.remove("d-none")
    this.uploadCardTarget.classList.remove("d-none")
    this.loadingCardTarget.classList.add("d-none")
  }

  // Revoke all blob URLs to free memory
  revokeBlobUrls() {
    this.blobUrls.forEach(url => URL.revokeObjectURL(url))
    this.blobUrls = []
  }

  // Show error message
  showError(message) {
    this.errorMessageTarget.textContent = message
    this.errorBoxTarget.classList.remove("d-none")
  }

  // Hide error message
  hideError() {
    this.errorBoxTarget.classList.add("d-none")
  }
}

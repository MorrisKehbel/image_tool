import { Controller } from "@hotwired/stimulus"

// Manages state between upload form and results view.
export default class extends Controller {
  static targets = ["upload", "results", "loading", "uploadCard", "fileInput", "form"]

  connect() {
    // Mark animation as played after it completes
    this.uploadCardTarget.addEventListener('animationend', () => {
      this.uploadCardTarget.classList.add('animation-played')
    }, { once: true })

    // Mark header animation as played after it completes
    const uploadHeader = document.querySelector('.upload-header')
    if (uploadHeader) {
      uploadHeader.addEventListener('animationend', () => {
        uploadHeader.classList.add('animation-played')
      }, { once: true })
    }
  }

  // Handles file selection and shows loading before submitting
  handleFileChange() {
    if (this.fileInputTarget.files.length > 0) {
      // Hide any previous error messages
      const errorBox = document.querySelector('.error-box')
      if (errorBox) {
        errorBox.remove()
      }

      // Show loading state first
      this.uploadCardTarget.classList.add("d-none")
      this.loadingTarget.classList.remove("d-none")

      // Wait for DOM to update before submitting
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.formTarget.submit()
        })
      })
    }
  }

  // Resets to upload state: shows upload form, hides results
  reset(event) {
    event.preventDefault()
    
    // Show upload section
    this.uploadTarget.classList.remove("d-none")
    
    // Hide results section
    this.resultsTarget.classList.add("d-none")
    
    // Reset to upload card state (hide loading)
    this.uploadCardTarget.classList.remove("d-none")
    this.loadingTarget.classList.add("d-none")
    
    // Clear the file input so user can select the same file again
    const fileInput = this.uploadTarget.querySelector('input[type="file"]')
    if (fileInput) {
      fileInput.value = ""
    }
  }
}

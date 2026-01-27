import { Controller } from "@hotwired/stimulus"

// Manages state between upload form and results view.
export default class extends Controller {
  static targets = ["upload", "results"]

  // Resets to upload state: shows upload form, hides results
  reset(event) {
    event.preventDefault()
    
    // Show upload section
    this.uploadTarget.classList.remove("d-none")
    
    // Hide results section
    this.resultsTarget.classList.add("d-none")
    
    // Clear the file input so user can select the same file again
    const fileInput = this.uploadTarget.querySelector('input[type="file"]')
    if (fileInput) {
      fileInput.value = ""
    }
  }
}

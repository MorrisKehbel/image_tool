import { Controller } from "@hotwired/stimulus"

// Handles drag and drop file uploads. Attach to a form element.
export default class extends Controller {
  static targets = ["input", "card"]
  static classes = ["active"]
  
  dragCounter = 0

  // Registers global listeners to prevent browser's default file drop behavior
  connect() {
    this.preventDefaults = this.preventDefaults.bind(this)
    window.addEventListener("dragover", this.preventDefaults)
    window.addEventListener("drop", this.preventDefaults)
  }

  // Cleans up global listeners when controller is removed
  disconnect() {
    window.removeEventListener("dragover", this.preventDefaults)
    window.removeEventListener("drop", this.preventDefaults)
  }

  // Stops browser from handling the drag/drop event
  preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  // Highlights the drop area when a file enters
  dragenter(e) {
    this.preventDefaults(e)
    this.dragCounter++
    this.cardTarget.classList.add(this.activeClass)
  }

  // Changes the cursor while dragging over the drop area
  dragover(e) {
    this.preventDefaults(e)
    e.dataTransfer.dropEffect = "copy"
  }

  // Removes highlight when file leaves the drop area
  dragleave(e) {
    this.preventDefaults(e)
    this.dragCounter--
    if (this.dragCounter === 0) {
      this.cardTarget.classList.remove(this.activeClass)
    }
  }

  drop(e) {
    this.preventDefaults(e)
    this.dragCounter = 0
    this.cardTarget.classList.remove(this.activeClass)

    // Extracts the first file from the drop event
    const files = e.dataTransfer.files
    if (files.length === 0) return

    // Creates a DataTransfer to programmatically set the file input's files
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(files[0])
    this.inputTarget.files = dataTransfer.files

    // Trigger change event to handle loading state and form submission
    this.inputTarget.dispatchEvent(new Event('change', { bubbles: true }))
  }

  // Returns the CSS class to apply when dragging (default: "dropzone-active")
  get activeClass() {
    return this.hasActiveClass ? this.activeClassClass : "dropzone-active"
  }
}

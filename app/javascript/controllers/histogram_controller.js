import { Controller } from "@hotwired/stimulus"
import Chart from "chart.js/auto"

/**
 * Histogram Controller
 * Generates and displays a luminance histogram from a B&W image.
 * Uses Chart.js to render a smooth area chart visualization.
 */
export default class extends Controller {
  static targets = ["canvas", "image", "overlay", "button"]

  connect() {
    // Bind handlers
    this.handleImageLoad = this.handleImageLoad.bind(this)
    this.handleReset = this.reset.bind(this)

    // Listen for load events
    this.imageTarget.addEventListener("load", this.handleImageLoad)

    // Listen for reset event from image-processor controller
    window.addEventListener("image-processor:reset", this.handleReset)

    // If image is already loaded with valid data, generate histogram
    if (this.imageTarget.complete && this.imageTarget.naturalWidth > 0) {
      this.generateHistogram()
    }
  }

  disconnect() {
    // Clean up event listeners
    this.imageTarget.removeEventListener("load", this.handleImageLoad)
    window.removeEventListener("image-processor:reset", this.handleReset)

    // Destroy chart instance to prevent memory leaks
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  }

  handleImageLoad() {
    // Only generate if image has valid dimensions
    if (this.imageTarget.naturalWidth > 0) {
      this.generateHistogram()
    }
  }

  // Reset histogram to initial state
  reset() {
    // Hide overlay
    this.overlayTarget.classList.remove("active")

    // Reset button icon
    const icon = this.buttonTarget.querySelector("i")
    icon.classList.remove("bi-x-lg")
    icon.classList.add("bi-bar-chart-fill")
    this.buttonTarget.title = "Histogramm anzeigen"
  }

  toggleOverlay() {
    this.overlayTarget.classList.toggle("active")
    
    const isActive = this.overlayTarget.classList.contains("active")
    const icon = this.buttonTarget.querySelector("i")
  
    if (isActive) {
      icon.classList.remove("bi-bar-chart-fill")
      icon.classList.add("bi-x-lg")

      this.buttonTarget.title = "Schließen"
    } else {
      icon.classList.remove("bi-x-lg")
      icon.classList.add("bi-bar-chart-fill")

      this.buttonTarget.title = "Histogramm anzeigen"
    }
  }

  generateHistogram() {
    const img = this.imageTarget
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    
    // Draw image to canvas to extract pixel data
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Count pixel intensities (grayscale values 0-255)
    const histogram = new Array(256).fill(0)
    
    for (let i = 0; i < data.length; i += 4) {
      // For grayscale, R = G = B, so just use R channel
      const intensity = data[i]
      histogram[intensity]++
    }
    
    // Smooth the histogram with a moving average for a cleaner look
    const smoothed = this.smoothHistogram(histogram, 3)
    
    // Normalize to percentage for better display
    const totalPixels = canvas.width * canvas.height
    const normalized = smoothed.map(count => (count / totalPixels) * 100)
    
    this.renderChart(normalized)
  }

  smoothHistogram(data, windowSize) {
    const smoothed = []
    const half = Math.floor(windowSize / 2)
    
    for (let i = 0; i < data.length; i++) {
      let sum = 0
      let count = 0
      
      for (let j = -half; j <= half; j++) {
        const idx = i + j
        if (idx >= 0 && idx < data.length) {
          sum += data[idx]
          count++
        }
      }
      
      smoothed.push(sum / count)
    }
    
    return smoothed
  }

  renderChart(data) {
    // Destroy existing chart if any
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }

    // Green color scheme for histograms
    const primaryColor = "rgba(22, 172, 122, 0.8)"
    const gradientColor = "rgba(22, 172, 122, 0.1)"
    
    const ctx = this.canvasTarget.getContext("2d")
    
    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 200)
    gradient.addColorStop(0, primaryColor)
    gradient.addColorStop(1, gradientColor)
    
    // Labels for x-axis
    const labels = Array.from({ length: 256 }, (_, i) => i)

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Pixel-Verteilung",
          data: data,
          fill: true,
          backgroundColor: gradient,
          borderColor: primaryColor,
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: primaryColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index"
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            titleColor: "#333",
            bodyColor: "#666",
            borderColor: "rgba(0, 0, 0, 0.1)",
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              title: (items) => `Helligkeit: ${items[0].label}`,
              label: (item) => `${item.raw.toFixed(2)}% der Pixel`
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Helligkeit (0 = Schwarz, 255 = Weiß)",
              color: "#576071",
              font: {
                size: 11,
                weight: 500
              }
            },
            ticks: {
              color: "#576071",
              autoSkip: false, 
              maxRotation: 0,
              minRotation: 0,
              callback: (value) => {
                if (value === 0) return "0"
                if (value === 128) return "128"
                if (value === 255) return "255"
                return ""
              }
            },
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "% der Pixel",
              color: "#576071",
              font: {
                size: 11,
                weight: 500
              }
            },
            ticks: {
              color: "#576071",
              maxTicksLimit: 5,
              callback: (value) => value.toFixed(1) + "%"
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)"
            }
          }
        }
      }
    })
  }
}

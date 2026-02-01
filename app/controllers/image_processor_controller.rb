require "vips"

class ImageProcessorController < ApplicationController
  MAX_SIZE = 10.megabytes
  MAX_DIMENSION = 1200

  def index; end

  def create
    uploaded_image = upload_params[:image]

    # Validation: Check if image is present
    unless uploaded_image.present?
      flash.now[:alert] = "Bitte wähle ein Bild aus"
      return render :index, status: :unprocessable_entity
    end

    # Validation: Check if image content type is valid
    unless valid_content_type?(uploaded_image)
      flash.now[:alert] = "Ungültiges Dateiformat: #{uploaded_image.content_type}. Bitte lade ein Bild hoch."
      return render :index, status: :unprocessable_entity
    end

    # Validation: Check if image size is valid
    unless valid_size?(uploaded_image)
      flash.now[:alert] = "Datei zu groß (#{(uploaded_image.size / 1.megabyte).round(1)} MB). Maximum: 10 MB"
      return render :index, status: :unprocessable_entity
    end

    # Process image
    process_images(uploaded_image)
    render :index

  # Error handling
  rescue Vips::Error => e
    Rails.logger.error("Image processing failed: #{e.message}")
    flash.now[:alert] = "Bildverarbeitung fehlgeschlagen: #{e.message}"
    render :index, status: :unprocessable_entity
  rescue StandardError => e
    Rails.logger.error("Unexpected error: #{e.class} - #{e.message}")
    flash.now[:alert] = "Unerwarteter Fehler: #{e.message}"
    render :index, status: :unprocessable_entity
  end

  private

  def upload_params
    params.permit(:image)
  end

  # Call Validation: Check if content type is any image format
  def valid_content_type?(uploaded_image)
    uploaded_image&.content_type.to_s.downcase.start_with?("image/")
  end

  # Call Validation: Check if image size is valid
  def valid_size?(uploaded_image)
    uploaded_image&.size.to_i <= MAX_SIZE
  end

  # Process images
  def process_images(uploaded_image)
    high_contrast_file = nil
    flat_gray_file = nil

    source_path = uploaded_image.path

    # Load source image with random access (required for multiple operations)
    source = Vips::Image.new_from_file(source_path)

    # Resize to reasonable max size while preserving aspect ratio
    scale = [ MAX_DIMENSION.to_f / source.width, MAX_DIMENSION.to_f / source.height, 1.0 ].min
    source = source.resize(scale) if scale < 1.0

    # Convert to grayscale first
    grayscale = source.colourspace(:b_w)

    # Version 1: "Starker Kontrast" - High contrast B&W
    high_contrast = grayscale.linear([ 1.4 ], [ -30 ])

    high_contrast_file = Tempfile.new([ "high_contrast", ".jpg" ])
    high_contrast.jpegsave(high_contrast_file.path, Q: 90)

    # Version 2: "Flaches Grau" - Soft/flat B&W
    flat_gray = grayscale.linear([ 0.7 ], [ 40 ])

    flat_gray_file = Tempfile.new([ "flat_gray", ".jpg" ])
    flat_gray.jpegsave(flat_gray_file.path, Q: 90)

    @images = [
      { src: encode_image(high_contrast_file, "image/jpeg"), label: "Starker Kontrast", size: "high_contrast" },
      { src: encode_image(flat_gray_file, "image/jpeg"), label: "Flaches Grau", size: "flat_gray" }
    ]
  ensure
    # Clean up temp files
    [ high_contrast_file, flat_gray_file ].compact.each do |file|
      file&.close
      file&.unlink
    end
  end

  # Encode image to base64 for display/download
  def encode_image(file, content_type)
    data = File.binread(file.path)
    "data:#{content_type};base64,#{Base64.strict_encode64(data)}"
  end
end

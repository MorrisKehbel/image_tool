require "vips"

class ImageProcessorController < ApplicationController
  MAX_SIZE = 10.megabytes
  MAX_DIMENSION = 2560
  PREVIEW_DIMENSION = 800
  PREVIEW_QUALITY = 60
  DOWNLOAD_QUALITY = 100
  VARIANTS = {
    "high_contrast" => { linear_a: 1.4, linear_b: -30 },
    "flat_gray" => { linear_a: 0.7, linear_b: 40 }
  }.freeze

  # Ensure libvips memory is released after processing
  after_action :force_gc_cleanup, only: [ :preview, :download ]

  # GET / - Display upload form
  def index; end

  # POST /preview - Stream low-quality preview image
  def preview
    validate_upload!
    validate_variant!

    jpeg_bytes = process_image(
      max_dimension: PREVIEW_DIMENSION,
      quality: PREVIEW_QUALITY
    )

    send_data jpeg_bytes,
              type: "image/jpeg",
              disposition: "inline"

  rescue ValidationError => e
    render json: { error: e.message }, status: :unprocessable_entity
  rescue Vips::Error => e
    Rails.logger.error("[ImageProcessor] Vips error: #{e.message}")
    render json: { error: "Bildverarbeitung fehlgeschlagen" }, status: :unprocessable_entity
  end

  # POST /download - Stream image as attachment
  def download
    validate_upload!
    validate_variant!

    jpeg_bytes = process_image(
      max_dimension: MAX_DIMENSION,
      quality: DOWNLOAD_QUALITY
    )

    send_data jpeg_bytes,
              type: "image/jpeg",
              disposition: "attachment",
              filename: "bild_#{params[:variant]}_#{Time.current.strftime('%Y%m%d_%H%M%S')}.jpg"

  rescue ValidationError => e
    flash[:alert] = e.message
    redirect_to root_path
  rescue Vips::Error => e
    Rails.logger.error("[ImageProcessor] Vips error: #{e.message}")
    flash[:alert] = "Bildverarbeitung fehlgeschlagen. Bitte versuche ein anderes Bild."
    redirect_to root_path
  end

  private

  def upload_params
    params.permit(:image)
  end

  class ValidationError < StandardError; end

  def validate_upload!
    raise ValidationError, "Bitte wähle ein Bild aus." unless params[:image].present?

    content_type = params[:image].content_type.to_s.downcase
    unless content_type.start_with?("image/")
      raise ValidationError, "Ungültiges Dateiformat."
    end

    if params[:image].size > MAX_SIZE
      size_mb = (params[:image].size.to_f / 1.megabyte).round(1)
      raise ValidationError, "Datei zu groß (#{size_mb} MB)."
    end
  end

  def validate_variant!
    unless VARIANTS.key?(params[:variant])
      raise ValidationError, "Ungültige Variante."
    end
  end

  # Process image and return JPEG bytes.
  def process_image(max_dimension:, quality:)
    config = VARIANTS[params[:variant]]

    # Load from file - Rack manages the tempfile lifecycle
    image = Vips::Image.new_from_file(params[:image].path)

    # Auto-rotate based on EXIF orientation
    image = image.autorot

    # Resize to fit within max dimension
    scale = [
      max_dimension.to_f / image.width,
      max_dimension.to_f / image.height,
      1.0
    ].min
    image = image.resize(scale) if scale < 1.0

    # Convert to grayscale
    image = image.colourspace(:b_w)

    # Apply contrast adjustment
    image = image.linear([ config[:linear_a] ], [ config[:linear_b] ])

    # Get JPEG bytes - this forces evaluation of the entire pipeline
    # All processing happens here
    image.jpegsave_buffer(Q: quality, strip: true)
  end

  # release libvips memory
  def force_gc_cleanup
    # clean up Vips::Image objects
    GC.start

    # Log memory in development
    if Rails.env.development?
      Rails.logger.debug "[Vips] Memory: #{(Vips.tracked_mem / 1024.0 / 1024.0).round(2)} MB"
    end
  end
end

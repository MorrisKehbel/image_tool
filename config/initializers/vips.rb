# frozen_string_literal: true

# Configure libvips for minimal memory usage in production.

Rails.application.config.to_prepare do
  require "vips"

  # Disable operation cache completely (default is 1000 operations)
  # Operations won't be reused across requests anyway
  Vips.cache_set_max(0)

  # Disable memory cache completely (default is 100MB)
  # Prevents decoded pixel data from being held in memory
  Vips.cache_set_max_mem(0)

  # Disable file descriptor cache (default is 100)
  # Ensures file handles are released immediately
  Vips.cache_set_max_files(0)

  # Limit concurrency to 1 thread per operation
  # Prevents libvips from spawning multiple threads that increase memory
  # Also reduces memory fragmentation from parallel allocations
  Vips.concurrency_set(1)

  # Log configuration for verification
  if Rails.env.development?
    Rails.logger.info "[Vips] Configuration: " \
                      "cache_max=#{Vips.cache_max}, " \
                      "cache_max_mem=#{Vips.cache_max_mem}, " \
                      "cache_max_files=#{Vips.cache_max_files}, " \
                      "concurrency=#{Vips.concurrency}"
  end
end

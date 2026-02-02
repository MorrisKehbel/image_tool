Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Image processor routes
  root "image_processor#index"

  # POST /preview - Stream low-quality preview
  post "/preview", to: "image_processor#preview", as: :preview_image

  # POST /download - Stream full-quality image as attachment
  post "/download", to: "image_processor#download", as: :download_image
end

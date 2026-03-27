# encoding: utf-8
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Members
      resources :members do
        collection do
          post :bulk_update
        end
      end

      # Works (duties)
      resources :works do
        collection do
          post :shuffle
          post :bulk_update
        end
        resources :off_work_dates, only: [:index, :create, :destroy]
      end

      # History
      resources :histories, only: [:index, :create, :destroy] do
        collection do
          post :bulk_create
        end
      end

      # Shuffle options
      resources :shuffle_options, only: [:show, :update]

      # Reset dates
      resources :reset_dates, only: [:index, :update] do
        collection do
          post :bulk_update
        end
      end
    end
  end

  # React App - Serve index.html for all other routes
  root "pages#index"
  match "*path", to: "pages#index", via: :all
end

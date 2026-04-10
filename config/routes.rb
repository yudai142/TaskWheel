# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users,
             controllers: {
               omniauth_callbacks: 'users/omniauth_callbacks'
             },
             skip: %i[sessions registrations passwords]

  namespace :api do
    namespace :v1 do
      scope :auth do
        get :me, to: 'sessions#me'
        post :login, to: 'sessions#login'
        post :logout, to: 'sessions#logout'
        post :register, to: 'sessions#register'
        patch :switch_worksheet, to: 'sessions#switch_worksheet'
        post 'password/validate_token', to: 'passwords#validate_token'
        post 'password/forgot', to: 'passwords#forgot'
        post 'password/reset', to: 'passwords#reset'
      end

      # Members
      resources :members do
        collection do
          post :bulk_create
          post :bulk_update
        end
      end

      # Works (duties)
      resources :works do
        collection do
          post :bulk_create
          post :shuffle
          post :shuffle_with_selected_members
          post :bulk_update
        end
        resources :off_work_dates, only: %i[index create destroy]
      end

      # History
      resources :histories, only: %i[index create destroy] do
        collection do
          post :bulk_create
        end
      end

      # Shuffle options
      resources :shuffle_options, only: %i[show update]

      # Reset dates
      resources :reset_dates, only: %i[index update] do
        collection do
          post :bulk_update
        end
      end

      # Member options
      resources :member_options, only: %i[index create destroy] do
        collection do
          post :update_selected
        end
      end

      # Worksheets
      resources :worksheets, only: %i[index create show update destroy]

      # Dashboard
      get 'dashboard/member_selection_state', to: 'dashboard#member_selection_state'
    end
  end

  # React App - Serve index.html for all other routes
  root 'pages#index'
  match '*path', to: 'pages#index', via: :all
end

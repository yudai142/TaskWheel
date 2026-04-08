# frozen_string_literal: true

require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module TaskWheel
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

    config.api_only = false

    # CORS設定
    if Rails.env.development?
      config.middleware.use Rack::Cors do
        allow do
          origins 'localhost', '127.0.0.1', '0.0.0.0'
          resource '*', headers: :any, methods: %i[get post put patch delete options]
        end
      end
    end
  end
end

require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module DutyShuffle
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be configured before loading any application code.

    # Make all time zone offsets use integers [false] or TimeWithZone [true].
    # Rails 7.1 defaults to false.
    # config.active_support.utc_to_time_preserves_timezone = true

    # Raise error when a before_action's only/except options reference missing actions
    # config.action_controller.raise_on_missing_callback_actions = true

    # API mode - disable views and session
    config.api_only = false

    # CORSÝ’è
    config.middleware.use Rack::Cors do
      allow do
        origins "localhost", "127.0.0.1", "0.0.0.0"
        resource "*", headers: :any, methods: [:get, :post, :put, :patch, :delete, :options]
      end
    end if Rails.env.development?

    # React Rails‚ÌÝ’è
    config.react.camelize_props = false

    # ShakapackerÝ’è
    config.webpacker.check_yarn_integrity = true
    config.webpacker.check_brotli_in_precompile = true
  end
end

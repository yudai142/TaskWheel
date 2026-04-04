# This file is copied to spec/ when you run 'rails generate rspec:install'
# and modified to work with Rails 7+
require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'

# Set test database URL to prevent remote database errors in DatabaseCleaner
ENV['DATABASE_URL'] = ENV.fetch('DATABASE_URL_TEST', 'postgresql://postgres:password@localhost:5432/duty_shuffle_test')

# Configure FactoryBot to prevent duplicate definition errors
require File.expand_path('../config/environment', __dir__)

# Clear any existing factory definitions to prevent duplicates
if FactoryBot.factories.instance_variable_get(:@factories)
  FactoryBot.factories.instance_variable_get(:@factories).clear
end

# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?

require 'rspec/rails'

# Add additional requires below this line. Rails is not loaded until this point!

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  puts e.to_s.strip
  exit 1
end

RSpec.configure do |config|
  # Remove this line to allow ActiveRecord to raise an error for migrations with missing names
  # config.pending_migration_checker = :migrations

  # Checks for pending migrations before running the test suite
  # If you are not using ActiveRecord, you can remove these lines.
  config.before(:suite) do
    # Disable DatabaseCleaner safeguard for Docker tests
    DatabaseCleaner.allow_remote_database_url = true
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:truncation)
  end

  config.around(:each) do |example|
    DatabaseCleaner.cleaning do
      example.run
    end
  end

  # RSpec Rails can automatically mix in different behaviours to your tests
  # based on their file location, for example enabling you to call `get` and
  # `post` in specs under `spec/requests`.
  # You can disable this behaviour by removing the line below, and instead
  # explicitly tag your specs with their type, e.g.:
  #
  #     RSpec.describe UsersController, type: :request do
  #     end
  #
  # The different available types are documented in the features, but here are
  # a few examples:
  #
  #     # Unit/Spec tests
  #     describe MyClass do
  #       ...
  #     end
  #
  #     # Integration tests
  #     describe "POST /items" do
  #       ...
  #     end
  #
  config.infer_spec_type_from_file_location!

  # Filter lines from Rails gems in backtraces.
  config.filter_rails_from_backtrace!
end

# Include factory_bot methods
include FactoryBot::Syntax::Methods

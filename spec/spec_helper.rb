# This file is copied to spec/ when you run 'rails generate rspec:install'
# and modified to work with Rails 7+
# See http://rspec.info/documentation/

# Ensure test environment is set before anything else
# Docker環境でdevelopmentが注入されるケースがあるため、RSpecでは常にtestを強制する
ENV['RAILS_ENV'] = 'test'

RSpec.configure do |config|
  # rspec-expectations config goes here. You can use an alternate
  # assertion/expectation library such as wrong or the stdlib/minitest
  # assertions if you prefer.
  config.expect_with :rspec do |expectations|
    # This option will default to `true` in RSpec 4. It offers more
    # verbose output by default while maintaining backwards
    # compatibility with RSpec 3.
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  # rspec-mocks config goes here. You can use an alternate test double
  # library such as bogus or nice as an alternative to rspec-mocks.
  config.mock_with :rspec do |mocks|
    # Prevents you from mocking or stubbing a method that does not exist on
    # a real object. This is generally recommended, and will default to
    # `true` in RSpec 4.
    mocks.verify_partial_doubles = true
  end

  # This option will default to `:apply_to_host_groups` in RSpec 4 (and will
  # have no effect). It is up to you to opt into the new behavior.
  config.shared_context_metadata_behavior = :apply_to_host_groups

  config.order = :random
  Kernel.srand config.seed
end

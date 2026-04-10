# frozen_string_literal: true

# Request spec helpers
RSpec.configure do |config|
  # Helper method to parse JSON response
  config.include Module.new {
    def json_response
      JSON.parse(response.body) if response.body.present?
    end
  }, type: :request
end

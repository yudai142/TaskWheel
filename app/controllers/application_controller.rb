# frozen_string_literal: true
# encoding: utf-8

class ApplicationController < ActionController::Base
  include ActionController::MimeResponds
  
  # Skip CSRF for API endpoints
  skip_before_action :verify_authenticity_token, if: :json_request?
  
  before_action :set_default_response_format

  private

  def set_default_response_format
    request.format = :json if request.path.start_with?('/api')
  end

  def json_request?
    request.path.start_with?('/api')
  end
end

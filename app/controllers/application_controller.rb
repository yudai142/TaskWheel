class ApplicationController < ActionController::Base
  include ActionController::MimeResponds
  
  before_action :set_default_response_format

  private

  def set_default_response_format
    request.format = :json if request.path.start_with?('/api')
  end
end

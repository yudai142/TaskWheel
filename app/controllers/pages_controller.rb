# frozen_string_literal: true

class PagesController < ApplicationController
  def index
    render :index, formats: [:html]
  end
end

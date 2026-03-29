# frozen_string_literal: true
# encoding: utf-8

class PagesController < ApplicationController
  def index
    render :index, formats: [:html]
  end
end

# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class BaseController < ActionController::API
      rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity

      protected

      def render_not_found(e)
        render json: { error: "Record not found", message: e.message }, status: :not_found
      end

      def render_unprocessable_entity(e)
        render json: { error: "Validation failed", messages: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      def render_error(message, status = :bad_request)
        render json: { error: message }, status: status
      end
    end
  end
end

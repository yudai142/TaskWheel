# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class ResetDatesController < BaseController
      def index
        render json: { reset_dates: [] }
      end

      def update
        # ZbgútÌXVWbN
        render json: { success: true }
      end

      def bulk_update
        # ¡ÌZbgútðêXV
        render json: { success: true }
      end
    end
  end
end

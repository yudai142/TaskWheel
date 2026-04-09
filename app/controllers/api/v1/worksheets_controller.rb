# frozen_string_literal: true

module Api
  module V1
    class WorksheetsController < BaseController
      def index
        worksheets = current_user.worksheets.order(created_at: :asc)
        render json: worksheets.map { |worksheet| serialize_worksheet(worksheet) }
      end

      def create
        deny_demo_user_modification!
        worksheet = current_user.worksheets.build(worksheet_params)
        if worksheet.save
          render json: serialize_worksheet(worksheet), status: :created
        else
          render json: { errors: worksheet.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def worksheet_params
        params.require(:worksheet).permit(:name, :interval, :week_use, :week)
      end

      def serialize_worksheet(worksheet)
        {
          id: worksheet.id,
          name: worksheet.name,
          interval: worksheet.interval,
          week_use: worksheet.week_use,
          week: worksheet.week
        }
      end
    end
  end
end

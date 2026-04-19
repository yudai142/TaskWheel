# frozen_string_literal: true

module Api
  module V1
    class OffWorksController < BaseController
      def index
        fetch_off_works
        render json: @off_works, each_serializer: OffWorkSerializer
      end

      def create
        @off_work = current_worksheet.off_works.build(off_work_params)
        @off_work.save!
        render json: @off_work, serializer: OffWorkSerializer, status: :created
      end

      def destroy
        @off_work = current_worksheet.off_works.find(params[:id])
        @off_work.destroy!
        head :no_content
      end

      private

      def fetch_off_works
        query = current_worksheet.off_works
        query = query.where(date: params[:date]) if params[:date].present?
        @off_works = query
      end

      def off_work_params
        params.require(:off_work).permit(:work_id, :date)
      end
    end
  end
end

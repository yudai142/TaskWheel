# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class OffWorkDatesController < BaseController
      before_action :set_work

      def index
        @off_works = @work.off_works
        render json: @off_works
      end

      def create
        @off_work = @work.off_works.build(off_work_params)
        @off_work.save!
        render json: @off_work, status: :created
      end

      def destroy
        @off_work = OffWork.find(params[:id])
        @off_work.destroy!
        head :no_content
      end

      private

      def set_work
        @work = Work.find(params[:work_id])
      end

      def off_work_params
        params.require(:off_work).permit(:date)
      end
    end
  end
end

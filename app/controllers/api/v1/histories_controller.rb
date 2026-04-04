# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class HistoriesController < BaseController
      def index
        @histories = if params[:year] && params[:month] && params[:day]
          date = Date.new(params[:year].to_i, params[:month].to_i, params[:day].to_i)
          History.by_date(date).recent
        elsif params[:year] && params[:month]
          History.by_month(params[:year], params[:month]).recent
        else
          History.recent
        end
        render json: @histories, include: [:work, :member]
      end

      def create
        @history = History.new(history_params)
        if @history.save
          render json: @history, status: :created
        else
          render json: { errors: @history.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @history = History.find(params[:id])
        @history.destroy!
        head :no_content
      end

      def bulk_create
        histories_data = Array(params[:histories])
        
        if histories_data.empty?
          return render_error("履歴データが指定されていません", :unprocessable_entity)
        end

        created_histories = []
        History.transaction do
          histories_data.each do |history_data|
            created_histories << History.create!(
              member_id: history_data[:member_id],
              work_id: history_data[:work_id],
              date: history_data[:date]
            )
          end
        end
        
        render json: { success: true, histories: created_histories }, status: :ok
      end

      private

      def history_params
        params.require(:history).permit(:work_id, :member_id, :date)
      end
    end
  end
end

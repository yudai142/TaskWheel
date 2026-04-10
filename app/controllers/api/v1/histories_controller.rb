# frozen_string_literal: true

module Api
  module V1
    class HistoriesController < BaseController
      def index
        worksheet = current_worksheet_for_params
        worksheet_member_ids = worksheet.members.pluck(:id)

        @histories = if params[:year] && params[:month] && params[:day]
                       date = Date.new(params[:year].to_i, params[:month].to_i, params[:day].to_i)
                       History.where(worksheet_id: worksheet.id, member_id: worksheet_member_ids).by_date(date).recent
                     elsif params[:year] && params[:month]
                       History.where(worksheet_id: worksheet.id, member_id: worksheet_member_ids).by_month(params[:year], params[:month]).recent
                     else
                       History.where(worksheet_id: worksheet.id, member_id: worksheet_member_ids).recent
                     end
        render json: @histories, include: %i[work member]
      end

      def create
        worksheet = current_worksheet_for_params
        @history = History.new(history_params.merge(worksheet_id: worksheet.id))
        if @history.save
          render json: @history, status: :created
        else
          render json: { errors: @history.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        worksheet = current_worksheet_for_params
        @history = History.find(params[:id])

        # worksheet_id が一致することを確認
        unless @history.worksheet_id == worksheet.id
          return render_error('このワークシートのHistoryではありません', :forbidden)
        end

        @history.destroy!
        head :no_content
      end

      def bulk_create
        worksheet = current_worksheet_for_params
        histories_data = Array(params[:histories])

        return render_error('履歴データが指定されていません', :unprocessable_content) if histories_data.empty?

        created_histories = []
        History.transaction do
          histories_data.each do |history_data|
            created_histories << History.create!(
              member_id: history_data[:member_id],
              work_id: history_data[:work_id],
              date: history_data[:date],
              worksheet_id: worksheet.id
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

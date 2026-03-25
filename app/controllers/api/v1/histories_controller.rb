module Api
  module V1
    class HistoriesController < BaseController
      def index
        @histories = if params[:year] && params[:month]
          History.by_month(params[:year], params[:month]).recent
        else
          History.recent
        end
        render json: @histories, include: [:work, :member]
      end

      def create
        @history = History.new(history_params)
        @history.save!
        render json: @history, status: :created
      end

      def destroy
        @history = History.find(params[:id])
        @history.destroy!
        head :no_content
      end

      def bulk_create
        History.transaction do
          params[:histories].each do |history_data|
            History.create!(history_data)
          end
        end
        render json: { success: true }
      end

      private

      def history_params
        params.require(:history).permit(:work_id, :member_id, :date)
      end
    end
  end
end

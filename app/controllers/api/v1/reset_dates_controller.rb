module Api
  module V1
    class ResetDatesController < BaseController
      def index
        render json: { reset_dates: [] }
      end

      def update
        # リセット日付の更新ロジック
        render json: { success: true }
      end

      def bulk_update
        # 複数のリセット日付を一括更新
        render json: { success: true }
      end
    end
  end
end

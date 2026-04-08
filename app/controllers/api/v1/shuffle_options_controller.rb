# frozen_string_literal: true

module Api
  module V1
    class ShuffleOptionsController < BaseController
      def show
        @shuffle_option = ShuffleOption.current
        if @shuffle_option
          render json: @shuffle_option
        else
          render json: { error: 'No shuffle option found' }, status: :not_found
        end
      end

      def update
        @shuffle_option = ShuffleOption.find(params[:id])
        @shuffle_option.update!(shuffle_option_params)
        render json: @shuffle_option
      end

      private

      def shuffle_option_params
        params.require(:shuffle_option).permit(:reset_date)
      end
    end
  end
end

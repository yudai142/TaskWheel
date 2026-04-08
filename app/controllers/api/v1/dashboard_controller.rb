# frozen_string_literal: true

module Api
  module V1
    class DashboardController < BaseController
      def member_selection_state
        response = current_worksheet.members.active.order(:id).map do |member|
          {
            id: member.id,
            member_id: member.id,
            status: 1
          }
        end

        render json: response, status: :ok
      end
    end
  end
end

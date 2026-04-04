module Api
  module V1
    class DashboardController < BaseController
      def member_selection_state
        # Get all member options with member details
        member_options = MemberOption.includes(:member).all

        # If no member_options exist, create defaults for all members
        if member_options.empty?
          Member.find_each do |member|
            MemberOption.find_or_create_by(member_id: member.id) do |option|
              option.status = 1 # Default to selected/participating
            end
          end
          member_options = MemberOption.includes(:member).all
        end

        # Build response
        response = member_options.map do |option|
          {
            id: option.id,
            member_id: option.member_id,
            status: option.status
          }
        end

        render json: response, status: :ok
      end
    end
  end
end

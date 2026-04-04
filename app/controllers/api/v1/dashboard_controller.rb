module Api
  module V1
    class DashboardController < BaseController
      def member_selection_state
        # Get work_id from params or use the first work
        work = Work.find_by(id: params[:work_id]) || Work.order(id: :asc).first
        return render json: { error: 'No work found' }, status: :not_found if work.blank?

        # Get all member options for this work
        member_options = MemberOption.where(work_id: work.id).includes(:member)

        # If no member_options exist for this work, create defaults for all members
        if member_options.empty?
          Member.find_each do |member|
            MemberOption.find_or_create_by(work_id: work.id, member_id: member.id) do |option|
              option.status = 1 # Default to selected/participating
            end
          end
          member_options = MemberOption.where(work_id: work.id).includes(:member)
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

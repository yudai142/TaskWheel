module Api
  module V1
    class MemberOptionsController < BaseController
      def update_selected
        # Get work_id and member options from params
        work_id = params[:work_id]
        member_options = params[:member_options] || []

        # Validate work_id
        return render json: { error: 'work_id is required' }, status: :unprocessable_entity if work_id.blank?

        # Upsert member options
        member_options.each do |option|
          MemberOption.upsert(
            { work_id: work_id, member_id: option[:member_id], status: option[:status] },
            unique_by: [:work_id, :member_id]
          )
        end

        # Count selected members for this work
        selected_count = MemberOption.where(work_id: work_id, status: 1).count

        render json: { selected_count: selected_count }, status: :ok
      end
    end
  end
end

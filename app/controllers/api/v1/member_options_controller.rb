module Api
  module V1
    class MemberOptionsController < BaseController
      def update_selected
        # Get member options array from params
        member_options = params[:member_options] || []

        # Upsert member options
        member_options.each do |option|
          MemberOption.upsert(
            { member_id: option[:member_id], status: option[:status] },
            unique_by: :member_id
          )
        end

        # Count selected members
        selected_count = MemberOption.where(status: 1).count

        render json: { selected_count: selected_count }, status: :ok
      end
    end
  end
end

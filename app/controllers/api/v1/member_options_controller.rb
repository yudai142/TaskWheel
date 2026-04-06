module Api
  module V1
    class MemberOptionsController < BaseController
      before_action :set_member_option, only: [:destroy]

      def index
        return render_error('member_id is required', :unprocessable_entity) if params[:member_id].blank?

        member_options = MemberOption.where(member_id: params[:member_id]).includes(:work).order(:id)
        render json: member_options.map { |option| serialize_member_option(option) }
      end

      def create
        member_option = MemberOption.find_or_initialize_by(
          member_id: member_option_params[:member_id],
          work_id: member_option_params[:work_id]
        )
        member_option.status = member_option_params[:status]
        member_option.save!

        render json: serialize_member_option(member_option), status: :ok
      end

      def update_selected
        member_options = params[:member_options] || []
        selected_count = member_options.count do |option|
          option[:status].to_i == 1 || option['status'].to_i == 1
        end

        render json: { selected_count: selected_count }, status: :ok
      end

      def destroy
        @member_option.destroy!
        head :no_content
      end

      private

      def set_member_option
        @member_option = MemberOption.find(params[:id])
      end

      def member_option_params
        params.require(:member_option).permit(:member_id, :work_id, :status)
      end

      def serialize_member_option(option)
        {
          id: option.id,
          member_id: option.member_id,
          work_id: option.work_id,
          work_name: option.work&.name,
          status: option.status,
          status_label: option.status.zero? ? '固定' : '除外'
        }
      end
    end
  end
end

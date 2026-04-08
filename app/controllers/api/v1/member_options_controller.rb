# frozen_string_literal: true

module Api
  module V1
    class MemberOptionsController < BaseController
      before_action :set_member_option, only: [:destroy]

      def index
        return render_error('member_id is required', :unprocessable_content) if params[:member_id].blank?

        member = current_worksheet.members.find_by(id: params[:member_id])
        return render_error('メンバーが見つかりません', :not_found) unless member

        member_options = MemberOption
                         .where(member_id: member.id, work_id: current_worksheet.works.select(:id))
                         .includes(:work)
                         .order(:id)
        render json: member_options.map { |option| serialize_member_option(option) }
      end

      def create
        member = current_worksheet.members.find(member_option_params[:member_id])
        work = current_worksheet.works.find(member_option_params[:work_id])
        member_option = MemberOption.create!(
          member_id: member.id,
          work_id: work.id,
          status: member_option_params[:status]
        )

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
        # current_worksheetに属するMemberのOptionに限定
        worksheet_member_ids = current_worksheet.members.pluck(:id)
        @member_option = MemberOption.joins(:member).where(id: params[:id], member_id: worksheet_member_ids).first
        render_not_found(ActiveRecord::RecordNotFound.new('MemberOption not found')) unless @member_option
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

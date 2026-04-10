# frozen_string_literal: true

module Api
  module V1
    class MembersController < BaseController
      before_action :set_member, only: %i[show update destroy]

      def index
        scope = current_worksheet.members.includes(member_options: :work).order(:id)
        
        # include_archived パラメータを優先
        if include_archived?
          scope = scope  # すべて含める
        else
          filter = params[:filter] || 'active'
          scope = case filter
                  when 'active'
                    scope.active
                  when 'archived'
                    scope.archived
                  when 'all'
                    scope
                  else
                    scope.active
                  end
        end
        
        render json: scope.map { |member| serialize_member(member) }
      end

      def show
        render json: serialize_member(@member)
      end

      def create
        deny_demo_user_modification! and return
        @member = current_worksheet.members.build(member_params)
        @member.save!
        render json: serialize_member(@member), status: :created
      end

      def update
        deny_demo_user_modification! and return
        @member.update!(member_params)
        render json: serialize_member(@member)
      end

      def destroy
        deny_demo_user_modification! and return
        @member.destroy!
        head :no_content
      end

      def bulk_create
        deny_demo_user_modification! and return
        members = []
        Member.transaction do
          params[:members].each do |member_data|
            member = current_worksheet.members.build(member_data.permit(:name, :kana, :archive))
            member.save!
            members << member
          end
        end
        render json: members.map { |member| serialize_member(member) }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render_error(e.record.errors.full_messages.join(', '), :unprocessable_content)
      end

      def bulk_update
        deny_demo_user_modification! and return
        Member.transaction do
          params[:members].each do |member_data|
            member = current_worksheet.members.find(member_data[:id])
            member.update!(member_data.except(:id))
          end
        end
        render json: { success: true }
      end

      private

      def set_member
        @member = current_worksheet.members.find(params[:id])
      end

      def member_params
        params.require(:member).permit(:name, :kana, :archive)
      end

      def include_archived?
        ActiveModel::Type::Boolean.new.cast(params[:include_archived])
      end

      def include_settings?
        ActiveModel::Type::Boolean.new.cast(params[:include_settings])
      end

      def serialize_member(member)
        payload = {
          id: member.id,
          name: member.name,
          kana: member.kana,
          archive: member.archive,
          created_at: member.created_at,
          updated_at: member.updated_at
        }

        return payload unless include_settings?

        payload.merge(
          member_options: member.member_options.sort_by { |option| [option.work_id, option.id] }.map do |option|
            {
              id: option.id,
              member_id: option.member_id,
              work_id: option.work_id,
              work_name: option.work&.name,
              status: option.status,
              status_label: option.status.zero? ? '固定' : '除外'
            }
          end
        )
      end
    end
  end
end

# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class MembersController < BaseController
      before_action :set_member, only: [:show, :update, :destroy]

      def index
        scope = Member.includes(member_options: :work).order(:id)
        scope = scope.active unless include_archived?
        render json: scope.map { |member| serialize_member(member) }
      end

      def show
        render json: serialize_member(@member)
      end

      def create
        @member = Member.new(member_params)
        @member.save!
        render json: @member, status: :created
      end

      def update
        @member.update!(member_params)
        render json: @member
      end

      def destroy
        @member.destroy!
        head :no_content
      end

      def bulk_update
        Member.transaction do
          params[:members].each do |member_data|
            member = Member.find(member_data[:id])
            member.update!(member_data.except(:id))
          end
        end
        render json: { success: true }
      end

      private

      def set_member
        @member = Member.find(params[:id])
      end

      def member_params
        params.require(:member).permit(:family_name, :given_name, :kana_name, :archive)
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
          family_name: member.family_name,
          given_name: member.given_name,
          kana_name: member.kana_name,
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

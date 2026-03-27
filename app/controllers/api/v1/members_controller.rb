# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class MembersController < BaseController
      before_action :set_member, only: [:show, :update, :destroy]

      def index
        @members = Member.all
        render json: @members
      end

      def show
        render json: @member
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
    end
  end
end

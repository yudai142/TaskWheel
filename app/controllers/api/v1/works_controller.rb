# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class WorksController < BaseController
      before_action :set_work, only: [:show, :update, :destroy]

      def index
        @works = Work.includes(:members, :off_works)
        render json: @works, include: [:members, :off_works]
      end

      def show
        render json: @work, include: [:members, :off_works]
      end

      def create
        @work = Work.new(work_params)
        @work.save!
        render json: @work, status: :created
      end

      def update
        @work.update!(work_params)
        render json: @work
      end

      def destroy
        @work.destroy!
        head :no_content
      end

      def shuffle
        work = Work.find(params[:work_id])
        members = work.available_members.active
        participant_member_ids = Array(params[:participant_member_ids]).map(&:to_i).uniq

        if params.key?(:participant_member_ids)
          members = members.where(id: participant_member_ids)
        end

        if members.empty?
          return render_error("割り当て可能なメンバーがいません", :unprocessable_entity)
        end

        # 指定された日付、またはデフォルトで今日の日付
        date = if params[:year] && params[:month] && params[:day]
          Date.new(params[:year].to_i, params[:month].to_i, params[:day].to_i)
        else
          Date.today
        end

        # その日のメンバーごとの割り当て数をカウント（N+1回避）
        assigned_counts = History.where(date: date).group(:member_id).count
        member_ids = members.pluck(:id)

        # 割り当て数が最も少ないメンバーを優先的に選択
        members_with_count = member_ids.map do |id|
          { id: id, count: assigned_counts[id] || 0 }
        end.sort_by { |m| m[:count] }

        # 割り当て数が最も少ないメンバーのグループから均等に割り当て
        min_count = members_with_count.first[:count]
        candidate_ids = members_with_count.select { |m| m[:count] == min_count }.map { |m| m[:id] }
        selected_member_id = candidate_ids.sample
        selected_member = members.find(selected_member_id)

        # 既に同じメンバーが同じ日付に記録されている場合は更新
        existing_history = History.find_by(member_id: selected_member.id, date: date)
        if existing_history
          existing_history.update!(work_id: work.id)
        else
          History.create!(
            work_id: work.id,
            member_id: selected_member.id,
            date: date
          )
        end

        # 同じメンバーの重複を除去
        remove_duplicate_assignments(date)

        render json: { success: true, member: selected_member }
      end

      def bulk_update
        Work.transaction do
          params[:works].each do |work_data|
            work = Work.find(work_data[:id])
            work.update!(work_data.except(:id))
          end
        end
        render json: { success: true }
      end

      private

      def set_work
        @work = Work.find(params[:id])
      end

      def work_params
        params.require(:work).permit(:name, :multiple, :archive, :is_above)
      end

      def remove_duplicate_assignments(date)
        # 指定日付のHistoryレコードをメンバーごとにグループ化
        histories = History.where(date: date)
        grouped = histories.group_by(&:member_id)

        # 同じメンバーが複数回割り当てられている場合、最初の1つ以外を削除
        grouped.each do |member_id, records|
          if records.length > 1
            # 最新の割り当てを保持し、それ以前のものを削除
            records.sort_by(&:id).slice(1..-1).each(&:destroy)
          end
        end
      end
    end
  end
end

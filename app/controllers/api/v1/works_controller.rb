# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class WorksController < BaseController
      before_action :set_work, only: [:show, :update, :destroy]

      def index
        @works = current_worksheet.works.includes(:members, :off_works)
        render json: @works, include: [:members, :off_works]
      end

      def show
        render json: @work, include: [:members, :off_works]
      end

      def create
        @work = current_worksheet.works.build(work_params)
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
        date = extract_target_date
        work_id = (params[:work_id] || params[:id]).to_i
        allocator = FairShuffleAllocator.new(
          date: date,
          worksheet: current_worksheet,
          participant_member_ids: params[:participant_member_ids]
        )

        if work_id.zero?
          return shuffle_for_date(allocator)
        end

        shuffle_single_work(work_id, date, allocator)
      end

      def bulk_update
        Work.transaction do
          params[:works].each do |work_data|
            work = current_worksheet.works.find(work_data[:id])
            work.update!(work_data.except(:id))
          end
        end
        render json: { success: true }
      end

      def shuffle_with_selected_members
        date = extract_target_date_from_param
        requested_member_ids = Array(params[:member_ids]).compact.map(&:to_i).uniq
        requested_work_ids = Array(params[:work_ids]).compact.map(&:to_i).uniq

        worksheet_member_ids = current_worksheet.members.where(id: requested_member_ids).pluck(:id)
        worksheet_work_ids = current_worksheet.works.where(id: requested_work_ids).pluck(:id)

        member_ids = worksheet_member_ids
        work_ids = worksheet_work_ids

        if member_ids.empty? || work_ids.empty?
          return render_error('member_ids と work_ids は必須です', :unprocessable_entity)
        end

        History.transaction do
          member_ids.each do |member_id|
            History.find_or_create_by!(member_id: member_id, date: date) do |history|
              history.work_id = nil
            end
          end
        end

        allocator = FairShuffleAllocator.new(
          date: date,
          worksheet: current_worksheet,
          participant_member_ids: member_ids,
          allowed_work_ids: work_ids
        )
        allocator.shuffle_for_date(member_ids: member_ids)

        shuffled_histories = History.where(date: date, member_id: member_ids).order(:id)
        render json: shuffled_histories
      rescue ActiveRecord::RecordInvalid => e
        render_error(e.record.errors.full_messages.join(', '), :unprocessable_entity)
      end

      private

      def set_work
        @work = current_worksheet.works.find(params[:id])
      end

      def work_params
        params.require(:work).permit(:name, :multiple, :archive, :is_above)
      end

      def remove_duplicate_assignments(date)
        # 指定日付のHistoryレコードをメンバーごとにグループ化
        worksheet_member_ids = current_worksheet.members.pluck(:id)
        histories = History.where(date: date, member_id: worksheet_member_ids)
        grouped = histories.group_by(&:member_id)

        # 同じメンバーが複数回割り当てられている場合、最初の1つ以外を削除
        grouped.each do |member_id, records|
          if records.length > 1
            # 最新の割り当てを保持し、それ以前のものを削除
            records.sort_by(&:id).slice(1..-1).each(&:destroy)
          end
        end
      end

      def extract_target_date
        if params[:year] && params[:month] && params[:day]
          Date.new(params[:year].to_i, params[:month].to_i, params[:day].to_i)
        else
          Date.today
        end
      end

      def extract_target_date_from_param
        return Date.parse(params[:date]) if params[:date].present?

        extract_target_date
      rescue ArgumentError
        extract_target_date
      end

      def shuffle_single_work(work_id, date, allocator)
        work = current_worksheet.works.find(work_id)
        selected_member = allocator.shuffle_single_work(work)

        if selected_member.nil?
          return render_error("割り当て可能なメンバーがいません", :unprocessable_entity)
        end

        remove_duplicate_assignments(date)

        render json: { success: true, member: selected_member }
      end

      def shuffle_for_date(allocator)
        worksheet_member_ids = current_worksheet.members.pluck(:id)
        histories = History.where(date: extract_target_date, member_id: worksheet_member_ids).includes(:member).to_a
        if histories.empty?
          return render_error("参加メンバーがいません", :unprocessable_entity)
        end

        works = load_shufflable_works(extract_target_date)
        if works.empty?
          return render_error("シャッフル対象の当番がありません", :unprocessable_entity)
        end

        render json: allocator.shuffle_for_date
      end

      def load_shufflable_works(date)
        off_work_ids = OffWork.where(date: date).pluck(:work_id)
        current_worksheet.works.active.where.not(id: off_work_ids)
      end

    end
  end
end

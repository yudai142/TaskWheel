# frozen_string_literal: true
# encoding: utf-8

module Api
  module V1
    class WorksController < BaseController
      before_action :set_work, only: [:show, :update, :destroy]

      SHUFFLE_FIXED_STATUS = 0
      SHUFFLE_EXCLUDED_STATUS = 1

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
        date = extract_target_date
        work_id = (params[:work_id] || params[:id]).to_i

        if work_id.zero?
          return shuffle_for_date(date)
        end

        shuffle_single_work(work_id, date)
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

      def extract_target_date
        if params[:year] && params[:month] && params[:day]
          Date.new(params[:year].to_i, params[:month].to_i, params[:day].to_i)
        else
          Date.today
        end
      end

      def shuffle_single_work(work_id, date)
        work = Work.find(work_id)
        members = work.available_members.active
        participant_member_ids = Array(params[:participant_member_ids]).compact.map(&:to_i).uniq

        members = members.where(id: participant_member_ids) if participant_member_ids.any?

        if members.empty?
          return render_error("割り当て可能なメンバーがいません", :unprocessable_entity)
        end

        assigned_counts = History.where(date: date).where.not(work_id: nil).group(:member_id).count
        member_ids = members.pluck(:id)
        members_with_count = member_ids.map { |id| { id: id, count: assigned_counts[id] || 0 } }
        min_count = members_with_count.min_by { |m| m[:count] }[:count]
        candidate_ids = members_with_count.select { |m| m[:count] == min_count }.map { |m| m[:id] }
        selected_member_id = candidate_ids.sample
        selected_member = members.find(selected_member_id)

        existing_history = History.find_or_initialize_by(member_id: selected_member.id, date: date)
        existing_history.work_id = work.id
        existing_history.save!

        remove_duplicate_assignments(date)

        render json: { success: true, member: selected_member }
      end

      def shuffle_for_date(date)
        histories = History.where(date: date).includes(:member).to_a
        if histories.empty?
          return render_error("参加メンバーがいません", :unprocessable_entity)
        end

        works = load_shufflable_works(date)
        if works.empty?
          return render_error("シャッフル対象の当番がありません", :unprocessable_entity)
        end

        work_slots, work_limits, work_assignment_count, work_info = build_work_slots(works)
        history_list = histories.map(&:id)
        history_members = histories.to_h { |h| [h.id, h.member_id] }

        expand_work_slots_for_is_above!(work_slots, work_info, history_list.length)
        work_slots.shuffle!
        history_list.shuffle!

        fixed_members, excluded_members = load_member_option_maps
        recent_member_works = load_recent_member_works(date)

        assignments = {}
        fixed_assigned = {}
        unassigned_members = {}

        history_list.each do |history_id|
          member_id = history_members[history_id]
          fixed_work_id = fixed_work_for_member(member_id, fixed_members)
          next if fixed_work_id.nil?

          if assignable_to_work?(member_id, fixed_work_id, excluded_members, recent_member_works, work_limits, work_assignment_count)
            assignments[history_id] = fixed_work_id
            work_assignment_count[fixed_work_id] += 1
            fixed_assigned[history_id] = true
          else
            assignments[history_id] = nil
            unassigned_members[history_id] = true
          end
        end

        unique_works_list = work_slots.uniq
        member_index = 0

        history_list.each do |history_id|
          if fixed_assigned[history_id]
            next
          end

          if unassigned_members[history_id]
            assignments[history_id] = nil
            member_index += 1
            next
          end

          member_id = history_members[history_id]
          assigned_work = find_assignable_work(unique_works_list, member_id, member_index, excluded_members, recent_member_works, work_limits, work_assignment_count)

          if assigned_work.nil?
            assignments[history_id] = nil
            unassigned_members[history_id] = true
          else
            assignments[history_id] = assigned_work
            work_assignment_count[assigned_work] += 1
          end

          member_index += 1
        end

        History.transaction do
          assignments.each do |history_id, work_id|
            History.where(id: history_id).update_all(work_id: work_id)
          end
        end

        render json: {
          success: true,
          assigned_count: assignments.values.compact.length,
          unassigned_count: assignments.values.count(&:nil?)
        }
      end

      def load_shufflable_works(date)
        off_work_ids = OffWork.where(date: date).pluck(:work_id)
        Work.active.where.not(id: off_work_ids)
      end

      def build_work_slots(works)
        work_slots = []
        work_limits = {}
        work_assignment_count = {}
        work_info = {}

        works.each do |work|
          multiple = work.multiple.to_i
          multiple = 1 if multiple <= 0

          work_info[work.id] = work
          work_assignment_count[work.id] = 0
          work_limits[work.id] = work.is_above ? -1 : multiple

          multiple.times { work_slots << work.id }
        end

        [work_slots, work_limits, work_assignment_count, work_info]
      end

      def expand_work_slots_for_is_above!(work_slots, work_info, participant_count)
        additional_needed = participant_count - work_slots.length
        return if additional_needed <= 0

        is_above_works = work_info.values.select(&:is_above).map(&:id)
        return if is_above_works.empty?

        idx = 0
        while additional_needed.positive?
          work_slots << is_above_works[idx % is_above_works.length]
          additional_needed -= 1
          idx += 1
        end
      end

      def load_member_option_maps
        fixed_members = Hash.new { |h, k| h[k] = [] }
        excluded_members = Hash.new { |h, k| h[k] = [] }

        MemberOption.find_each do |option|
          if option.status == SHUFFLE_FIXED_STATUS
            fixed_members[option.work_id] << option.member_id
          elsif option.status == SHUFFLE_EXCLUDED_STATUS
            excluded_members[option.work_id] << option.member_id
          end
        end

        [fixed_members, excluded_members]
      end

      def load_recent_member_works(date)
        worksheet = Worksheet.current
        return {} if worksheet.nil? || worksheet.interval.to_i <= 0

        start_date = date - worksheet.interval.days

        if worksheet.week_use
          0.upto(6) do |days_back|
            check_date = date - days_back.days
            if check_date.wday == worksheet.week
              start_date = check_date
              break
            end
          end
        else
          latest_reset_date = ShuffleOption.where("reset_date <= ?", date).order(reset_date: :desc).limit(1).pluck(:reset_date).first
          start_date = latest_reset_date if latest_reset_date.present?
        end

        rows = History.where(date: start_date..date).where.not(work_id: nil).distinct.pluck(:member_id, :work_id)
        rows.each_with_object(Hash.new { |h, k| h[k] = [] }) do |(member_id, work_id), memo|
          memo[member_id] << work_id unless memo[member_id].include?(work_id)
        end
      end

      def fixed_work_for_member(member_id, fixed_members)
        fixed_members.each do |work_id, member_ids|
          return work_id if member_ids.include?(member_id)
        end
        nil
      end

      def assignable_to_work?(member_id, work_id, excluded_members, recent_member_works, work_limits, work_assignment_count)
        is_excluded = excluded_members[work_id].include?(member_id)
        is_recent = recent_member_works.fetch(member_id, []).include?(work_id)
        within_limit = work_limits[work_id] == -1 || work_assignment_count[work_id] < work_limits[work_id]

        !is_excluded && !is_recent && within_limit
      end

      def find_assignable_work(unique_works_list, member_id, member_index, excluded_members, recent_member_works, work_limits, work_assignment_count)
        return nil if unique_works_list.empty?

        start_idx = member_index % unique_works_list.length

        unique_works_list.length.times do |offset|
          idx = (start_idx + offset) % unique_works_list.length
          candidate_work = unique_works_list[idx]
          next unless assignable_to_work?(member_id, candidate_work, excluded_members, recent_member_works, work_limits, work_assignment_count)

          return candidate_work
        end

        nil
      end
    end
  end
end

# frozen_string_literal: true

require 'zlib'

class FairnessScoreCalculator
  INELIGIBLE_SCORE = Float::INFINITY
  SAME_DAY_ASSIGNMENT_WEIGHT = 100_000_000
  TOTAL_ASSIGNMENT_WEIGHT = 1_000_000
  WORK_ASSIGNMENT_WEIGHT = 10_000
  RECENT_ASSIGNMENT_WEIGHT = 100
  RECENT_WORK_WEIGHT = 10
  RELAXED_RECENT_PENALTY = 5_000_000

  def initialize(date:, recent_member_works: {})
    @date = date
    @recent_member_works = recent_member_works
    @assigned_histories = History.where.not(work_id: nil)
    @total_assignment_counts = @assigned_histories.group(:member_id).count
    @work_assignment_counts = @assigned_histories.group(:member_id, :work_id).count
    @last_assigned_dates = @assigned_histories.group(:member_id).maximum(:date)
    @last_work_assigned_dates = @assigned_histories.group(:member_id, :work_id).maximum(:date)
  end

  def eligible?(member_id:, work_id:)
    !@recent_member_works.fetch(member_id, []).include?(work_id)
  end

  def score(member_id:, work_id:, same_day_assignments: 0, allow_recent_override: false)
    is_recent = @recent_member_works.fetch(member_id, []).include?(work_id)
    return INELIGIBLE_SCORE if is_recent && !allow_recent_override

    (same_day_assignments.to_i * SAME_DAY_ASSIGNMENT_WEIGHT) +
      (total_assignment_count(member_id) * TOTAL_ASSIGNMENT_WEIGHT) +
      (work_assignment_count(member_id, work_id) * WORK_ASSIGNMENT_WEIGHT) +
      (recent_assignment_penalty(member_id) * RECENT_ASSIGNMENT_WEIGHT) +
      (recent_work_penalty(member_id, work_id) * RECENT_WORK_WEIGHT) +
      (is_recent ? RELAXED_RECENT_PENALTY : 0) +
      stable_tie_breaker(member_id, work_id)
  end

  private

  def total_assignment_count(member_id)
    @total_assignment_counts[member_id] || 0
  end

  def work_assignment_count(member_id, work_id)
    @work_assignment_counts[[member_id, work_id]] || 0
  end

  def recent_assignment_penalty(member_id)
    recency_penalty(@last_assigned_dates[member_id], 30)
  end

  def recent_work_penalty(member_id, work_id)
    recency_penalty(@last_work_assigned_dates[[member_id, work_id]], 90)
  end

  def recency_penalty(last_date, window)
    return 0 if last_date.nil?

    days_since_last_assignment = [(@date - last_date).to_i, 0].max
    [window - days_since_last_assignment, 0].max
  end

  def stable_tie_breaker(member_id, work_id)
    Zlib.crc32("#{@date}:#{member_id}:#{work_id}") % 1000
  end
end
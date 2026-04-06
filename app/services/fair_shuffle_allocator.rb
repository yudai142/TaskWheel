# frozen_string_literal: true

class FairShuffleAllocator
  UNASSIGNED_COST = 10_000_000_000
  Slot = Struct.new(:work_id, :slot_index)

  def initialize(date:, participant_member_ids: [], allowed_work_ids: [])
    @date = date
    @participant_member_ids = Array(participant_member_ids).compact.map(&:to_i).uniq
    @allowed_work_ids = Array(allowed_work_ids).compact.map(&:to_i).uniq
    @recent_member_works = load_recent_member_works
    @score_calculator = FairnessScoreCalculator.new(date: @date, recent_member_works: @recent_member_works)
  end

  def shuffle_single_work(work)
    option_rules = load_member_option_rules([work.id])
    candidate_members = Member.active
    candidate_members = candidate_members.where(id: @participant_member_ids) if @participant_member_ids.any?

    fixed_member_ids = option_rules[:fixed_by_work][work.id]
    excluded_member_ids = option_rules[:excluded_by_work][work.id]
    candidate_members = candidate_members.where(id: fixed_member_ids) if fixed_member_ids.any?
    candidate_members = candidate_members.where.not(id: excluded_member_ids) if excluded_member_ids.any?

    today_assigned_counts = History.where(date: @date).where.not(work_id: nil).group(:member_id).count

    scored_candidates = build_single_work_candidates(
      candidate_members: candidate_members,
      work_id: work.id,
      today_assigned_counts: today_assigned_counts,
      allow_recent_override: false
    )

    if scored_candidates.empty?
      scored_candidates = build_single_work_candidates(
        candidate_members: candidate_members,
        work_id: work.id,
        today_assigned_counts: today_assigned_counts,
        allow_recent_override: true
      )
    end

    return nil if scored_candidates.empty?

    best_score = scored_candidates.min_by(&:last).last
    selected_member = scored_candidates.select { |_, score| score == best_score }.map(&:first).first

    history = History.find_or_initialize_by(member_id: selected_member.id, date: @date)
    history.work_id = work.id
    history.save!

    selected_member
  end

  def shuffle_for_date(member_ids: nil)
    histories = History.where(date: @date)
    histories = histories.where(member_id: member_ids) if member_ids.present?
    histories = histories.order(:id).to_a
    raise ActiveRecord::RecordInvalid, History.new if histories.empty?

    works = load_shufflable_works
    option_rules = load_member_option_rules(works.map(&:id))
    fixed_assignments, remaining_histories, preassigned_counts = build_fixed_assignments(histories, works, option_rules)
    work_slots = build_work_slots(works, remaining_histories.length, preassigned_counts)
    assignments = fixed_assignments.merge(solve_assignments(remaining_histories, work_slots, option_rules))

    # メモリ上で全員の割り当てが決まった段階でDBに一括保存
    History.transaction do
      assignments.each do |history_id, work_id|
        History.where(id: history_id).update_all(work_id: work_id)
      end
    end

    {
      success: true,
      assigned_count: assignments.values.compact.length,
      unassigned_count: assignments.values.count(&:nil?),
      assignments: assignments
    }
  end

  private

  def load_shufflable_works
    off_work_ids = OffWork.where(date: @date).pluck(:work_id)
    works = Work.active.where.not(id: off_work_ids)
    works = works.where(id: @allowed_work_ids) if @allowed_work_ids.any?
    works.order(:id).to_a
  end

  def build_work_slots(works, participant_count, preassigned_counts = {})
    work_slots = []
    is_above_work_ids = []

    works.each do |work|
      is_above_work_ids << work.id if work.is_above

      multiple = [work.multiple.to_i - preassigned_counts.fetch(work.id, 0), 0].max
      next if multiple <= 0

      multiple.times do |slot_index|
        work_slots << Slot.new(work.id, slot_index)
      end
    end

    additional_needed = participant_count - work_slots.length
    if additional_needed.positive? && is_above_work_ids.any?
      additional_needed.times do |offset|
        work_id = is_above_work_ids[offset % is_above_work_ids.length]
        work_slots << Slot.new(work_id, work_slots.count { |slot| slot.work_id == work_id })
      end
    end

    work_slots
  end

  def load_recent_member_works
    worksheet = Worksheet.current
    return {} if worksheet.nil? || worksheet.interval.to_i <= 0

    start_date = @date - worksheet.interval.days

    if worksheet.week_use
      0.upto(6) do |days_back|
        check_date = @date - days_back.days
        if check_date.wday == worksheet.week
          start_date = check_date
          break
        end
      end
    else
      latest_reset_date = ShuffleOption.where('reset_date <= ?', @date).order(reset_date: :desc).limit(1).pluck(:reset_date).first
      start_date = latest_reset_date if latest_reset_date.present?
    end

    History.where(date: start_date..@date)
      .where.not(work_id: nil)
      .distinct
      .pluck(:member_id, :work_id)
      .each_with_object(Hash.new { |hash, key| hash[key] = [] }) do |(member_id, work_id), recent_works|
        recent_works[member_id] << work_id unless recent_works[member_id].include?(work_id)
      end
  end

  def load_member_option_rules(work_ids)
    options = MemberOption.where(work_id: work_ids).order(:work_id, :member_id)

    options.each_with_object(
      fixed_by_member: Hash.new { |hash, key| hash[key] = [] },
      excluded_by_member: Hash.new { |hash, key| hash[key] = [] },
      fixed_by_work: Hash.new { |hash, key| hash[key] = [] },
      excluded_by_work: Hash.new { |hash, key| hash[key] = [] }
    ) do |option, rules|
      if option.status.zero?
        rules[:fixed_by_member][option.member_id] << option.work_id
        rules[:fixed_by_work][option.work_id] << option.member_id
      else
        rules[:excluded_by_member][option.member_id] << option.work_id
        rules[:excluded_by_work][option.work_id] << option.member_id
      end
    end
  end

  def build_fixed_assignments(histories, works, option_rules)
    available_work_ids = works.map(&:id)
    assignments = {}
    remaining_histories = []
    preassigned_counts = Hash.new(0)

    histories.each do |history|
      fixed_work_ids = option_rules[:fixed_by_member][history.member_id] & available_work_ids

      if fixed_work_ids.empty?
        remaining_histories << history
        next
      end

      fixed_work_id = fixed_work_ids.min
      if option_rules[:excluded_by_member][history.member_id].include?(fixed_work_id)
        assignments[history.id] = nil
        next
      end

      assignments[history.id] = fixed_work_id
      preassigned_counts[fixed_work_id] += 1
    end

    [assignments, remaining_histories, preassigned_counts]
  end

  def solve_assignments(histories, work_slots, option_rules)
    source = 0
    history_offset = 1
    slot_offset = history_offset + histories.length
    sink = slot_offset + work_slots.length
    graph = MinCostMaxFlow.new(sink + 1)
    assignment_edges = {}

    candidate_scores_by_history = histories.index_with do |history|
      scores = build_candidate_scores_for_history(history, work_slots, option_rules: option_rules, allow_recent_override: false)
      scores = build_candidate_scores_for_history(history, work_slots, option_rules: option_rules, allow_recent_override: true) if scores.empty?
      scores
    end

    global_max_score = candidate_scores_by_history.values.flat_map(&:values).max
    default_unassigned_cost = global_max_score.nil? ? UNASSIGNED_COST : global_max_score + 1

    histories.each_with_index do |history, index|
      history_node = history_offset + index
      graph.add_edge(source, history_node, 1, 0)

      candidate_scores = candidate_scores_by_history[history]

      candidate_scores.each do |slot_index, score|
        edge = graph.add_edge(history_node, slot_offset + slot_index, 1, score, true)
        assignment_edges[[history.id, slot_index]] = edge
      end

      fallback_cost = candidate_scores.empty? ? UNASSIGNED_COST : default_unassigned_cost
      graph.add_edge(history_node, sink, 1, fallback_cost, true)
    end

    work_slots.each_index do |slot_index|
      graph.add_edge(slot_offset + slot_index, sink, 1, 0)
    end

    graph.min_cost_flow(source, sink, histories.length)

    histories.each_with_object({}) do |history, result|
      assigned_slot_index = work_slots.each_index.find do |slot_index|
        assignment_edges[[history.id, slot_index]]&.capacity == 0
      end

      result[history.id] = assigned_slot_index.nil? ? nil : work_slots[assigned_slot_index].work_id
    end
  end

  class MinCostMaxFlow
    Edge = Struct.new(:to, :reverse_index, :capacity, :cost, :original)

    def initialize(size)
      @graph = Array.new(size) { [] }
    end

    def add_edge(from, to, capacity, cost, original = false)
      forward = Edge.new(to, @graph[to].length, capacity, cost, original)
      backward = Edge.new(from, @graph[from].length, 0, -cost, false)
      @graph[from] << forward
      @graph[to] << backward
      forward
    end

    def min_cost_flow(source, sink, target_flow)
      flow = 0

      while flow < target_flow
        distances = Array.new(@graph.length, Float::INFINITY)
        previous_vertices = Array.new(@graph.length)
        previous_edges = Array.new(@graph.length)
        in_queue = Array.new(@graph.length, false)
        queue = [source]
        distances[source] = 0
        in_queue[source] = true

        until queue.empty?
          vertex = queue.shift
          in_queue[vertex] = false

          @graph[vertex].each_with_index do |edge, edge_index|
            next if edge.capacity <= 0

            candidate_distance = distances[vertex] + edge.cost
            next unless candidate_distance < distances[edge.to]

            distances[edge.to] = candidate_distance
            previous_vertices[edge.to] = vertex
            previous_edges[edge.to] = edge_index

            next if in_queue[edge.to]

            queue << edge.to
            in_queue[edge.to] = true
          end
        end

        break if distances[sink].infinite?

        increment = target_flow - flow
        vertex = sink
        while vertex != source
          edge = @graph[previous_vertices[vertex]][previous_edges[vertex]]
          increment = [increment, edge.capacity].min
          vertex = previous_vertices[vertex]
        end

        vertex = sink
        while vertex != source
          previous_vertex = previous_vertices[vertex]
          edge = @graph[previous_vertex][previous_edges[vertex]]
          edge.capacity -= increment
          @graph[vertex][edge.reverse_index].capacity += increment
          vertex = previous_vertex
        end

        flow += increment
      end
    end
  end

  def build_single_work_candidates(candidate_members:, work_id:, today_assigned_counts:, allow_recent_override:)
    candidate_members.filter_map do |member|
      score = @score_calculator.score(
        member_id: member.id,
        work_id: work_id,
        same_day_assignments: today_assigned_counts[member.id] || 0,
        allow_recent_override: allow_recent_override
      )
      next if score.infinite?

      [member, score]
    end
  end

  def build_candidate_scores_for_history(history, work_slots, option_rules:, allow_recent_override:)
    excluded_work_ids = option_rules[:excluded_by_member][history.member_id]

    work_slots.each_with_index.each_with_object({}) do |(slot, slot_index), scores|
      next if excluded_work_ids.include?(slot.work_id)

      score = @score_calculator.score(
        member_id: history.member_id,
        work_id: slot.work_id,
        allow_recent_override: allow_recent_override
      )
      next if score.infinite?

      scores[slot_index] = score
    end
  end
end
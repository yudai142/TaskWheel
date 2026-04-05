# frozen_string_literal: true

class FairShuffleAllocator
  UNASSIGNED_COST = 10_000_000_000
  Slot = Struct.new(:work_id, :slot_index)

  def initialize(date:, participant_member_ids: [])
    @date = date
    @participant_member_ids = Array(participant_member_ids).compact.map(&:to_i).uniq
    @recent_member_works = load_recent_member_works
    @score_calculator = FairnessScoreCalculator.new(date: @date, recent_member_works: @recent_member_works)
  end

  def shuffle_single_work(work)
    candidate_members = work.available_members.active
    candidate_members = candidate_members.where(id: @participant_member_ids) if @participant_member_ids.any?

    today_assigned_counts = History.where(date: @date).where.not(work_id: nil).group(:member_id).count

    scored_candidates = candidate_members.filter_map do |member|
      score = @score_calculator.score(
        member_id: member.id,
        work_id: work.id,
        same_day_assignments: today_assigned_counts[member.id] || 0
      )
      next if score.infinite?

      [member, score]
    end

    return nil if scored_candidates.empty?

    best_score = scored_candidates.min_by(&:last).last
    selected_member = scored_candidates.select { |_, score| score == best_score }.map(&:first).first

    history = History.find_or_initialize_by(member_id: selected_member.id, date: @date)
    history.work_id = work.id
    history.save!

    selected_member
  end

  def shuffle_for_date
    histories = History.where(date: @date).order(:id).to_a
    raise ActiveRecord::RecordInvalid, History.new if histories.empty?

    works = load_shufflable_works
    work_slots = build_work_slots(works, histories.length)
    assignments = solve_assignments(histories, work_slots)

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
    Work.active.where.not(id: off_work_ids).order(:id).to_a
  end

  def build_work_slots(works, participant_count)
    work_slots = []
    is_above_work_ids = []

    works.each do |work|
      multiple = work.multiple.to_i
      next if multiple <= 0

      multiple.times do |slot_index|
        work_slots << Slot.new(work.id, slot_index)
      end

      is_above_work_ids << work.id if work.is_above
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

  def solve_assignments(histories, work_slots)
    source = 0
    history_offset = 1
    slot_offset = history_offset + histories.length
    sink = slot_offset + work_slots.length
    graph = MinCostMaxFlow.new(sink + 1)
    assignment_edges = {}
    unassigned_edges = {}

    histories.each_with_index do |history, index|
      history_node = history_offset + index
      graph.add_edge(source, history_node, 1, 0)
      unassigned_edges[history.id] = graph.add_edge(history_node, sink, 1, UNASSIGNED_COST, true)

      work_slots.each_with_index do |slot, slot_index|
        score = @score_calculator.score(member_id: history.member_id, work_id: slot.work_id)
        next if score.infinite?

        edge = graph.add_edge(history_node, slot_offset + slot_index, 1, score, true)
        assignment_edges[[history.id, slot_index]] = edge
      end
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
end
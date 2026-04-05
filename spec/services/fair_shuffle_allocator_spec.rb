# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FairShuffleAllocator, type: :service do
  let(:base_date) { Date.current }

  describe '#shuffle_for_date' do
    it '複数日にわたって総担当回数の差を最小化する' do
      members = create_list(:member, 4)
      works = create_list(:work, 2, multiple: 1, is_above: false, archive: false)

      12.times do |offset|
        target_date = base_date + offset.days
        members.each do |member|
          create(:history, member: member, work: nil, date: target_date)
        end

        described_class.new(date: target_date).shuffle_for_date
      end

      assignment_counts = History.where(date: base_date..(base_date + 11.days)).where.not(work_id: nil).group(:member_id).count.values
      expect(assignment_counts.max - assignment_counts.min).to be <= 1
    end

    it '同じ当番への偏りを最小化する' do
      members = create_list(:member, 2)
      works = create_list(:work, 2, multiple: 1, is_above: false, archive: false)

      10.times do |offset|
        target_date = base_date + offset.days
        members.each do |member|
          create(:history, member: member, work: nil, date: target_date)
        end

        described_class.new(date: target_date).shuffle_for_date
      end

      members.each do |member|
        member_work_counts = works.map do |work|
          History.where(member_id: member.id, work_id: work.id, date: base_date..(base_date + 9.days)).count
        end

        expect(member_work_counts.max - member_work_counts.min).to be <= 1
      end
    end

    it 'interval 内の同一当番再割り当てを避ける' do
      member = create(:member)
      work_a = create(:work, multiple: 1, is_above: true, archive: false)
      work_b = create(:work, multiple: 1, is_above: true, archive: false)
      Worksheet.create!(interval: 3, week_use: false, week: 0)

      create(:history, member: member, work: work_a, date: base_date - 1.day)
      create(:history, member: member, work: nil, date: base_date)

      result = described_class.new(date: base_date).shuffle_for_date

      expect(result[:success]).to eq(true)
      expect(History.find_by(member_id: member.id, date: base_date)&.work_id).to eq(work_b.id)
    end
  end

  describe '#shuffle_single_work' do
    it '総担当回数が少ない参加者を優先する' do
      work = create(:work, multiple: 1, is_above: true, archive: false)
      heavily_assigned_member = create(:member)
      lightly_assigned_member = create(:member)

      create(:member_option, work: work, member: heavily_assigned_member, status: 1)
      create(:member_option, work: work, member: lightly_assigned_member, status: 1)

      5.times do |offset|
        create(:history, member: heavily_assigned_member, work: work, date: base_date - (offset + 1).days)
      end
      create(:history, member: lightly_assigned_member, work: work, date: base_date - 1.day)

      selected_member = described_class.new(
        date: base_date,
        participant_member_ids: [heavily_assigned_member.id, lightly_assigned_member.id]
      ).shuffle_single_work(work)

      expect(selected_member&.id).to eq(lightly_assigned_member.id)
    end
  end
end
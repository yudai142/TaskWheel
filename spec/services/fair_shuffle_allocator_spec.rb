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

    it '空き枠がある場合は未割り当てにしない（recent制約は緩和される）' do
      member = create(:member)
      work = create(:work, multiple: 1, is_above: true, archive: false)
      Worksheet.create!(interval: 7, week_use: false, week: 0)

      create(:history, member: member, work: work, date: base_date - 1.day)
      create(:history, member: member, work: nil, date: base_date)

      result = described_class.new(date: base_date).shuffle_for_date

      expect(result[:success]).to eq(true)
      expect(result[:unassigned_count]).to eq(0)
      expect(History.find_by(member_id: member.id, date: base_date)&.work_id).to eq(work.id)
    end

    it '固定設定されたメンバーは指定当番に割り当てられる' do
      member = create(:member)
      fixed_work = create(:work, multiple: 1, is_above: false, archive: false)
      other_work = create(:work, multiple: 1, is_above: false, archive: false)
      create(:member_option, member: member, work: fixed_work, status: 0)
      create(:history, member: member, work: nil, date: base_date)

      result = described_class.new(date: base_date).shuffle_for_date

      expect(result[:success]).to eq(true)
      expect(History.find_by(member_id: member.id, date: base_date)&.work_id).to eq(fixed_work.id)
      expect(other_work).to be_present
    end

    it '固定設定が recent 制約と衝突した場合は未割り当てになる' do
      member = create(:member)
      fixed_work = create(:work, multiple: 1, is_above: true, archive: false)
      Worksheet.create!(interval: 7, week_use: false, week: 0)
      create(:member_option, member: member, work: fixed_work, status: 0)
      create(:history, member: member, work: fixed_work, date: base_date - 1.day)
      create(:history, member: member, work: nil, date: base_date)

      result = described_class.new(date: base_date).shuffle_for_date

      expect(result[:success]).to eq(true)
      expect(result[:unassigned_count]).to eq(1)
      expect(History.find_by(member_id: member.id, date: base_date)&.work_id).to be_nil
    end

    it '除外設定された当番は他候補がある限り割り当てない' do
      member = create(:member)
      excluded_work = create(:work, multiple: 1, is_above: false, archive: false)
      allowed_work = create(:work, multiple: 1, is_above: false, archive: false)
      create(:member_option, member: member, work: excluded_work, status: 1)
      create(:history, member: member, work: nil, date: base_date)

      result = described_class.new(date: base_date).shuffle_for_date

      expect(result[:success]).to eq(true)
      expect(History.find_by(member_id: member.id, date: base_date)&.work_id).to eq(allowed_work.id)
    end

    it 'is_above=true かつ multiple=0 でも不可能でなければ追加枠で割り当てる' do
      expandable_work = create(:work, multiple: 0, is_above: true, archive: false)
      participants = create_list(:member, 3)

      participants.each do |member|
        create(:history, member: member, work: nil, date: base_date)
      end

      result = described_class.new(date: base_date).shuffle_for_date

      expect(result[:success]).to eq(true)
      expect(result[:unassigned_count]).to eq(0)

      assigned = History.where(date: base_date, member_id: participants.map(&:id)).where.not(work_id: nil)
      expect(assigned.count).to eq(3)
      expect(assigned.pluck(:work_id).uniq).to eq([expandable_work.id])
    end

    it 'is_above=false の当番は multiple の上限を超えて割り当てない' do
      capped_work = create(:work, multiple: 1, is_above: false, archive: false)
      participants = create_list(:member, 3)

      participants.each do |member|
        create(:history, member: member, work: nil, date: base_date)
      end

      result = described_class.new(date: base_date).shuffle_for_date

      expect(result[:success]).to eq(true)
      expect(History.where(date: base_date, work_id: capped_work.id).count).to eq(1)
      expect(result[:unassigned_count]).to eq(2)
    end

    it 'is_above=true の追加枠は当番間で偏りを抑えて配分される' do
      work_a = create(:work, multiple: 1, is_above: true, archive: false)
      work_b = create(:work, multiple: 1, is_above: true, archive: false)
      participants = create_list(:member, 7)

      participants.each do |member|
        create(:history, member: member, work: nil, date: base_date)
      end

      result = described_class.new(date: base_date).shuffle_for_date

      expect(result[:success]).to eq(true)
      counts = History.where(date: base_date, work_id: [work_a.id, work_b.id]).group(:work_id).count
      expect(counts.values.sum).to eq(7)
      expect((counts[work_a.id] - counts[work_b.id]).abs).to be <= 1
    end
  end

  describe '#shuffle_single_work' do
    it '総担当回数が少ない参加者を優先する' do
      work = create(:work, multiple: 1, is_above: true, archive: false)
      heavily_assigned_member = create(:member)
      lightly_assigned_member = create(:member)

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
# This file is auto-executed by Rails after running the migrations.
# It's perfect for populating the database with seed data.

# Create sample members
members = [
  { family_name: '田中', given_name: '太郎', kana_name: 'たなか たろう' },
  { family_name: '鈴木', given_name: '花子', kana_name: 'すずき はなこ' },
  { family_name: '佐藤', given_name: '次郎', kana_name: 'さとう じろう' },
  { family_name: '高橋', given_name: '美咲', kana_name: 'たかはし みさき' },
  { family_name: '伊藤', given_name: '健太', kana_name: 'いとう けんた' },
]

puts "Creating sample members..."
members.each do |member_attr|
  Member.find_or_create_by(family_name: member_attr[:family_name], given_name: member_attr[:given_name]) do |member|
    member.kana_name = member_attr[:kana_name]
  end
end
puts "Created #{Member.count} members"

# Create sample works
works = [
  { name: 'トイレ掃除', multiple: 1, is_above: true },
  { name: 'キッチン掃除', multiple: 1, is_above: true },
  { name: 'フロア掃除', multiple: 2, is_above: false },
  { name: 'ゴミ出し', multiple: 1, is_above: true },
]

puts "Creating sample works..."
works.each do |work_attr|
  Work.find_or_create_by(name: work_attr[:name]) do |work|
    work.multiple = work_attr[:multiple]
    work.is_above = work_attr[:is_above]
  end
end
puts "Created #{Work.count} works"

# Associate members with works
puts "Associating members with works..."
Member.find_each do |member|
  Work.find_each do |work|
    MemberOption.find_or_create_by(member_id: member.id, work_id: work.id) do |option|
      option.status = 1 # 対象
    end
  end
end
puts "Created #{MemberOption.count} member options"

# Create shuffle option
puts "Creating shuffle option..."
ShuffleOption.find_or_create_by(reset_date: Date.today)

# Create worksheet
puts "Creating worksheet..."
Worksheet.find_or_create_by(interval: 30) do |worksheet|
  worksheet.week_use = false
  worksheet.week = 0
end

puts ""
puts "? Seed data created successfully!"

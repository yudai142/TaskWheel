class UnifyMemberNameColumns < ActiveRecord::Migration[7.1]
  def up
    # 1. 新しいカラムを追加（一時的）
    add_column :members, :name_new, :string, null: true
    add_column :members, :kana_new, :string, null: true

    # 2. 既存データを新しいカラムに移行
    Member.find_each do |member|
      name = "#{member.family_name}#{member.given_name}"
      member.update_column(:name_new, name)
      member.update_column(:kana_new, member.kana_name)
    end

    # 3. 新しいカラムを NOT NULL に
    change_column_null :members, :name_new, false
    change_column_null :members, :kana_new, false

    # 4. 古いカラムを削除
    remove_column :members, :family_name
    remove_column :members, :given_name
    remove_column :members, :kana_name

    # 5. 新しいカラムをリネーム
    rename_column :members, :name_new, :name
    rename_column :members, :kana_new, :kana
  end

  def down
    # ロールバック
    add_column :members, :family_name, :string, null: false, limit: 30
    add_column :members, :given_name, :string, null: false, limit: 30
    add_column :members, :kana_name, :string, null: false

    Member.find_each do |member|
      # 名前を分割復元（最初の30文字を family_name、残りを given_name）
      name = member.name || ''
      family_name = name[0...30]
      given_name = name[30..-1] || ''
      
      member.update_column(:family_name, family_name)
      member.update_column(:given_name, given_name)
      member.update_column(:kana_name, member.kana || '')
    end

    remove_column :members, :name
    remove_column :members, :kana
  end
end

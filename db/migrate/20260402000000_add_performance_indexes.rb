class AddPerformanceIndexes < ActiveRecord::Migration[7.1]
  def change
    # Histories テーブル - シャッフル時のクエリ最適化
    add_index :histories, [:member_id, :date], if_not_exists: true
    add_index :histories, :date, if_not_exists: true

    # Member Options - available_members/unavailable_members 最適化
    add_index :member_options, [:work_id, :status], if_not_exists: true
    add_index :member_options, [:member_id, :status], if_not_exists: true

    # Members - archive フラグでのフィルタが多いため
    add_index :members, :archive, if_not_exists: true

    # Works - archive フラグでのフィルタが多いため
    add_index :works, :archive, if_not_exists: true

    # Off works - 日付チェックが頻発
    add_index :off_works, :date, if_not_exists: true
  end
end

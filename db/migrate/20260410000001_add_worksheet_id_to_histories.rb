# frozen_string_literal: true

class AddWorksheetIdToHistories < ActiveRecord::Migration[7.1]
  def change
    # 新しい worksheet_id カラムを追加（外部キー制約付き）
    add_column :histories, :worksheet_id, :bigint, null: true

    # 既存データを移行: work_id のワークシート ID を使用
    reversible do |dir|
      dir.up do
        # work_id が存在するレコードに対して、関連ワークのワークシート ID を設定
        execute(<<-SQL)
          UPDATE histories
          SET worksheet_id = works.worksheet_id
          FROM works
          WHERE histories.work_id = works.id AND histories.work_id IS NOT NULL
        SQL

        # work_id が null のレコード（参加状態のみ）に対しても worksheet_id を設定する必要があります
        # ここでは一時的に最初のワークシート ID を使用
        execute(<<-SQL)
          UPDATE histories
          SET worksheet_id = COALESCE(
            (SELECT worksheet_id FROM members WHERE members.id = histories.member_id LIMIT 1),
            (SELECT id FROM worksheets LIMIT 1)
          )
          WHERE worksheet_id IS NULL
        SQL
      end
    end

    # NOT NULL 制約を追加
    change_column_null :histories, :worksheet_id, false

    # 外部キー制約を追加
    add_foreign_key :histories, :worksheets, column: :worksheet_id

    # インデックスを追加（クエリ効率化用）
    add_index :histories, :worksheet_id
    add_index :histories, [:worksheet_id, :date]
  end
end

# frozen_string_literal: true

# 既存データをデフォルトユーザーに紐づけるマイグレーション
class MigrateExistingDataToDefaultUser < ActiveRecord::Migration[7.1]
  def up
    # デフォルトユーザーを作成
    default_user_id = execute(<<~SQL).first&.dig("id")
      INSERT INTO users (email, encrypted_password, name, created_at, updated_at)
      VALUES ('default@taskwheel.local', '', 'デフォルトユーザー', NOW(), NOW())
      RETURNING id
    SQL

    return unless default_user_id

    # 既存ワークシートにuser_idとnameを設定（未設定のものだけ）
    execute(<<~SQL)
      UPDATE worksheets
      SET user_id = #{default_user_id},
          name = 'デフォルトワークシート'
      WHERE user_id IS NULL
    SQL

    # 既存メンバーをデフォルトワークシートに紐づけ
    default_worksheet_id = execute("SELECT id FROM worksheets WHERE user_id = #{default_user_id} LIMIT 1").first&.dig("id")

    if default_worksheet_id
      execute(<<~SQL)
        UPDATE members SET worksheet_id = #{default_worksheet_id} WHERE worksheet_id IS NULL
      SQL

      execute(<<~SQL)
        UPDATE works SET worksheet_id = #{default_worksheet_id} WHERE worksheet_id IS NULL
      SQL
    end
  end

  def down
    # ロールバック時はデフォルトユーザーを削除（関連データのNULL化は外部キー制約でブロックするため手動処理）
    execute("UPDATE members SET worksheet_id = NULL")
    execute("UPDATE works SET worksheet_id = NULL")
    execute("UPDATE worksheets SET user_id = NULL, name = NULL")
    execute("DELETE FROM users WHERE email = 'default@taskwheel.local'")
  end
end

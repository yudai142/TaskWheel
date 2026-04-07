# frozen_string_literal: true

class DeviseCreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      # Devise標準カラム
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      t.string :reset_password_token
      t.datetime :reset_password_sent_at

      t.datetime :remember_created_at

      # OmniAuth用カラム
      t.string :provider
      t.string :uid
      t.string :name

      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, [:provider, :uid],     unique: true, name: "index_users_on_provider_and_uid"
  end
end

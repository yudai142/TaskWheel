class CreateInitialSchema < ActiveRecord::Migration[7.1]
  def change
    # Members table
    create_table :members do |t|
      t.string :family_name, limit: 30, null: false
      t.string :given_name, limit: 30, null: false
      t.string :kana_name, null: false
      t.boolean :archive, default: false

      t.timestamps
    end

    # Works table (duties)
    create_table :works do |t|
      t.string :name, null: false
      t.integer :multiple
      t.boolean :archive, default: false
      t.boolean :is_above, default: true

      t.timestamps
    end

    # Member options table
    create_table :member_options do |t|
      t.references :work, null: false, foreign_key: true
      t.references :member, null: false, foreign_key: true
      t.integer :status, null: false

      t.timestamps
    end

    # History table
    create_table :histories do |t|
      t.references :work, foreign_key: true
      t.references :member, null: false, foreign_key: true
      t.date :date, null: false

      t.timestamps
    end

    # Shuffle options table
    create_table :shuffle_options do |t|
      t.date :reset_date

      t.timestamps
    end

    # Off work table
    create_table :off_works do |t|
      t.references :work, null: false, foreign_key: true
      t.date :date, null: false

      t.timestamps
    end

    # Worksheet table
    create_table :worksheets do |t|
      t.integer :interval, null: false
      t.boolean :week_use, default: false
      t.integer :week, default: 0

      t.timestamps
    end

    # Indexes
    add_index :member_options, [:work_id, :member_id], unique: true
    add_index :histories, [:member_id, :date]
    add_index :off_works, [:work_id, :date], unique: true
  end
end

# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_04_02_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "histories", force: :cascade do |t|
    t.bigint "work_id"
    t.bigint "member_id", null: false
    t.date "date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_histories_on_date"
    t.index ["member_id", "date"], name: "index_histories_on_member_id_and_date"
    t.index ["member_id"], name: "index_histories_on_member_id"
    t.index ["work_id"], name: "index_histories_on_work_id"
  end

  create_table "member_options", force: :cascade do |t|
    t.bigint "work_id", null: false
    t.bigint "member_id", null: false
    t.integer "status", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["member_id", "status"], name: "index_member_options_on_member_id_and_status"
    t.index ["member_id"], name: "index_member_options_on_member_id"
    t.index ["work_id", "member_id"], name: "index_member_options_on_work_id_and_member_id", unique: true
    t.index ["work_id", "status"], name: "index_member_options_on_work_id_and_status"
    t.index ["work_id"], name: "index_member_options_on_work_id"
  end

  create_table "members", force: :cascade do |t|
    t.string "family_name", limit: 30, null: false
    t.string "given_name", limit: 30, null: false
    t.string "kana_name", null: false
    t.boolean "archive", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["archive"], name: "index_members_on_archive"
  end

  create_table "off_works", force: :cascade do |t|
    t.bigint "work_id", null: false
    t.date "date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_off_works_on_date"
    t.index ["work_id", "date"], name: "index_off_works_on_work_id_and_date", unique: true
    t.index ["work_id"], name: "index_off_works_on_work_id"
  end

  create_table "shuffle_options", force: :cascade do |t|
    t.date "reset_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "works", force: :cascade do |t|
    t.string "name", null: false
    t.integer "multiple"
    t.boolean "archive", default: false
    t.boolean "is_above", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["archive"], name: "index_works_on_archive"
  end

  create_table "worksheets", force: :cascade do |t|
    t.integer "interval", null: false
    t.boolean "week_use", default: false
    t.integer "week", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "histories", "members"
  add_foreign_key "histories", "works"
  add_foreign_key "member_options", "members"
  add_foreign_key "member_options", "works"
  add_foreign_key "off_works", "works"
end

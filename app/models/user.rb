# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [:google_oauth2]

  has_many :worksheets, dependent: :destroy

  validates :email, presence: true, uniqueness: true

  # デモ用メンバーデータ（新スキーマに対応: name, kana）
  DEMO_MEMBERS_DATA = [
    { name: 'テスト太郎', kana: 'てすとたろう', archive: false },
    { name: 'テスト花子', kana: 'てすとはなこ', archive: false },
    { name: '釘子津佳冴', kana: 'くぎこつかさ', archive: false },
    { name: '長谷川異風', kana: 'はせがわいふう', archive: false },
    { name: '樋口伊吹', kana: 'ひぐちいぶき', archive: false },
    { name: '小泉俊一', kana: 'こいずみしゅんいち', archive: false },
    { name: '北川優斗', kana: 'きたがわゆうと', archive: false },
    { name: '小股晄', kana: 'おまたあき', archive: false },
    { name: '田鹿蒼史', kana: 'たじかそうじ', archive: false },
    { name: '芦生浩明', kana: 'あしおひろあき', archive: false },
    { name: '高宮城誉有治', kana: 'たかみやぎようき', archive: false },
    { name: '朴清', kana: 'ぼくきよし', archive: false },
    { name: '西加治工祐樹', kana: 'にしかじくゆうき', archive: false },
    { name: '雉子谷茂夫', kana: 'きじだにしげお', archive: false },
    { name: '渡谷身志', kana: 'わたりやみり', archive: false },
    { name: '室石遙摯', kana: 'むろいしはると', archive: false },
    { name: '塩足壱', kana: 'しおたりいち', archive: false },
    { name: '筒屋厳春', kana: 'つつやみねはる', archive: false },
    { name: '日陰茂井昊', kana: 'ひかげもいそら', archive: false },
    { name: '精廬里備', kana: 'とぐろさとはる', archive: false },
    { name: '喜美候部智絃', kana: 'きみこうべちづる', archive: false },
    { name: '竹乘成也', kana: 'たけのりなりや', archive: false },
    { name: '安達城灯', kana: 'あだちきと', archive: false },
    { name: '森田悠翔', kana: 'もりたはると', archive: false },
    { name: '矢野英一', kana: 'やのえいいち', archive: false },
    { name: '誉田和樹', kana: 'ほまれだかずき', archive: false },
    { name: '数瑛斗', kana: 'かずえいと', archive: false }
  ].freeze

  # デモ用当番データ（seed.js から複製）
  DEMO_WORKS_DATA = [
    { name: 'リーダー', multiple: 0, archive: false, is_above: false },
    { name: 'ハンディモップ', multiple: 0, archive: false, is_above: false },
    { name: 'アクリルボード', multiple: 0, archive: false, is_above: false },
    { name: 'ガラス拭き', multiple: 0, archive: false, is_above: false },
    { name: '除菌シート', multiple: 0, archive: false, is_above: false },
    { name: '窓の出っ張り', multiple: 0, archive: false, is_above: false },
    { name: 'コロコロ', multiple: 0, archive: false, is_above: false },
    { name: 'アルコール拭き', multiple: 0, archive: false, is_above: false },
    { name: '水拭き', multiple: 0, archive: false, is_above: false },
    { name: 'ゴミ捨て', multiple: 0, archive: false, is_above: false },
    { name: '掃除機', multiple: 0, archive: true, is_above: false }
  ].freeze

  # デモアカウント（test@example.com）が存在しない場合に生成
  # ※ 複数のユーザーが存在する場合でも、デモアカウントが必要なら生成される
  def self.seed_demo_user!
    # デモアカウントが既に存在する場合はスキップ
    existing_user = User.find_by(email: 'test@example.com')
    return existing_user if existing_user

    user = User.create!(
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      name: 'デモユーザー'
    )

    worksheet = user.worksheets.create!(
      name: 'デモワークシート',
      interval: 1,
      week_use: false,
      week: 0
    )

    # デモメンバーデータ生成
    DEMO_MEMBERS_DATA.each do |member_data|
      worksheet.members.create!(member_data)
    end

    # デモ当番データ生成
    DEMO_WORKS_DATA.each do |work_data|
      worksheet.works.create!(work_data)
    end

    user
  end

  # Google OmniAuthコールバック時にユーザーを検索または作成
  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email    = auth.info.email
      user.name     = auth.info.name
      user.password = Devise.friendly_token[0, 20]
      user.provider = auth.provider
      user.uid      = auth.uid
    end
  end

  def display_name
    name.presence || email
  end
end

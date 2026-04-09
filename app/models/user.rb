# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [:google_oauth2]

  has_many :worksheets, dependent: :destroy

  validates :email, presence: true, uniqueness: true

  # デモ用メンバーデータ（seed.js から複製）
  DEMO_MEMBERS_DATA = [
    { family_name: 'テスト', given_name: '太郎', kana_name: 'てすとたろう', archive: false },
    { family_name: 'テスト', given_name: '花子', kana_name: 'てすとはなこ', archive: false },
    { family_name: '釘子', given_name: '津佳冴', kana_name: 'くぎこつかさ', archive: false },
    { family_name: '長谷川', given_name: '異風', kana_name: 'はせがわいふう', archive: false },
    { family_name: '樋口', given_name: '伊吹', kana_name: 'ひぐちいぶき', archive: false },
    { family_name: '小泉', given_name: '俊一', kana_name: 'こいずみしゅんいち', archive: false },
    { family_name: '北川', given_name: '優斗', kana_name: 'きたがわゆうと', archive: false },
    { family_name: '小股', given_name: '晄', kana_name: 'おまたあき', archive: false },
    { family_name: '田鹿', given_name: '蒼史', kana_name: 'たじかそうじ', archive: false },
    { family_name: '芦生', given_name: '浩明', kana_name: 'あしおひろあき', archive: false },
    { family_name: '高宮城', given_name: '誉有治', kana_name: 'たかみやぎようき', archive: false },
    { family_name: '朴', given_name: '清', kana_name: 'ぼくきよし', archive: false },
    { family_name: '西加治工', given_name: '祐樹', kana_name: 'にしかじくゆうき', archive: false },
    { family_name: '雉子谷', given_name: '茂夫', kana_name: 'きじだにしげお', archive: false },
    { family_name: '渡谷', given_name: '身志', kana_name: 'わたりやみり', archive: false },
    { family_name: '室石', given_name: '遙摯', kana_name: 'むろいしはると', archive: false },
    { family_name: '塩足', given_name: '壱', kana_name: 'しおたりいち', archive: false },
    { family_name: '筒屋', given_name: '厳春', kana_name: 'つつやみねはる', archive: false },
    { family_name: '日陰茂井', given_name: '昊', kana_name: 'ひかげもいそら', archive: false },
    { family_name: '精廬', given_name: '里備', kana_name: 'とぐろさとはる', archive: false },
    { family_name: '喜美候部', given_name: '智絃', kana_name: 'きみこうべちづる', archive: false },
    { family_name: '竹乘', given_name: '成也', kana_name: 'たけのりなりや', archive: false },
    { family_name: '安達', given_name: '城灯', kana_name: 'あだちきと', archive: false },
    { family_name: '森田', given_name: '悠翔', kana_name: 'もりたはると', archive: false },
    { family_name: '矢野', given_name: '英一', kana_name: 'やのえいいち', archive: false },
    { family_name: '誉田', given_name: '和樹', kana_name: 'ほまれだかずき', archive: false },
    { family_name: '数', given_name: '瑛斗', kana_name: 'かずえいと', archive: false }
  ].freeze

  # デモ用当番データ（seed.js から複製）
  DEMO_WORKS_DATA = [
    { name: 'リーダー', multiple: false, archive: false, is_above: false },
    { name: 'ハンディモップ', multiple: false, archive: false, is_above: false },
    { name: 'アクリルボード', multiple: false, archive: false, is_above: false },
    { name: 'ガラス拭き', multiple: false, archive: false, is_above: false },
    { name: '除菌シート', multiple: false, archive: false, is_above: false },
    { name: '窓の出っ張り', multiple: false, archive: false, is_above: false },
    { name: 'コロコロ', multiple: false, archive: false, is_above: false },
    { name: 'アルコール拭き', multiple: false, archive: false, is_above: false },
    { name: '水拭き', multiple: false, archive: false, is_above: false },
    { name: 'ゴミ捨て', multiple: false, archive: false, is_above: false },
    { name: '掃除機', multiple: false, archive: true, is_above: false }
  ].freeze

  # ユーザーが一人も登録されていない場合、デモアカウントとサンプルデータを生成
  def self.seed_demo_user!
    return if User.count > 0

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
